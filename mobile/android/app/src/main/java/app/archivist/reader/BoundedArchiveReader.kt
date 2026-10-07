package app.archivist.reader

import android.content.Context
import android.net.Uri
import android.os.CancellationSignal
import android.os.ParcelFileDescriptor
import android.os.SystemClock
import android.system.Os
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import java.io.File
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.atomic.AtomicReference

/** One-at-a-time bounded archive evidence bridge with watchdog and circuit breaker. */
internal object BoundedArchiveReader {
  private val worker=Executors.newSingleThreadExecutor()
  private val timer=Executors.newSingleThreadScheduledExecutor()
  private val busy=AtomicBoolean(false)
  private val tripped=AtomicBoolean(false)
  private val cancelActive=AtomicReference<(() -> Unit)?>(null)

  fun cancel(){cancelActive.get()?.invoke()}

  fun read(context:Context,value:String,extension:String,promise:Promise){
    if(tripped.get()||!busy.compareAndSet(false,true)){
      promise.reject("operation-timeout","Archive evidence reader is unavailable for this session.")
      return
    }
    val settled=AtomicBoolean(false)
    val cancelled=AtomicBoolean(false)
    val signal=CancellationSignal()
    val descriptor=AtomicReference<ParcelFileDescriptor?>(null)
    val started=SystemClock.elapsedRealtime()
    val deadline=started+2000L
    fun abort(code:String,message:String,trip:Boolean){
      cancelled.set(true)
      if(trip)tripped.set(true)
      if(settled.compareAndSet(false,true))promise.reject(code,message)
      timer.execute{
        try{signal.cancel()}catch(_:Throwable){}
        try{descriptor.getAndSet(null)?.close()}catch(_:Throwable){}
      }
    }
    val cancel={abort("operation-cancelled","Archive evidence read was cancelled.",false)}
    cancelActive.set(cancel)
    val watchdog=timer.schedule({abort("operation-timeout","Archive evidence read exceeded the 2 second deadline.",true)},2000,TimeUnit.MILLISECONDS)
    worker.execute{
      try{
        val pfd=openPfd(context,value,signal)
        descriptor.set(pfd)
        val size=pfd.statSize
        if(size<0)throw BoundedArchiveEvidence.ProbeFailure("nonseekable","Archive provider does not expose seekable bounded access.")
        val shouldContinue={ !cancelled.get()&&!settled.get()&&SystemClock.elapsedRealtime()<=deadline }
        val ext=extension.trim().lowercase().removePrefix(".")
        val evidence=when(ext){
          "epub","cbz","zip"->{
            val base=object:BoundedZipProbe.SeekableReader{
              override val size:Long=size
              override fun read(offset:Long,length:Int):ByteArray{
                val bytes=ByteArray(length)
                var total=0
                while(total<length){
                  if(!shouldContinue())throw BoundedArchiveEvidence.ProbeFailure(if(cancelled.get())"operation-cancelled" else "operation-timeout","Archive evidence read stopped.")
                  val count=Os.pread(pfd.fileDescriptor,bytes,total,length-total,offset+total)
                  if(count<=0)break
                  total+=count
                }
                return if(total==length)bytes else bytes.copyOf(total)
              }
            }
            BoundedArchiveEvidence.probeZip(ext,GuardedArchiveReader(base,{SystemClock.elapsedRealtime()},shouldContinue,2000))
          }
          "cbt"->{
            val base=object:BoundedZipProbe.SeekableReader{
              override val size:Long=size
              override fun read(offset:Long,length:Int):ByteArray{
                val bytes=ByteArray(length)
                var total=0
                while(total<length){
                  if(!shouldContinue())throw BoundedArchiveEvidence.ProbeFailure(if(cancelled.get())"operation-cancelled" else "operation-timeout","Archive evidence read stopped.")
                  val count=Os.pread(pfd.fileDescriptor,bytes,total,length-total,offset+total)
                  if(count<=0)break
                  total+=count
                }
                return if(total==length)bytes else bytes.copyOf(total)
              }
            }
            BoundedTarEvidence.probe(GuardedArchiveReader(base,{SystemClock.elapsedRealtime()},shouldContinue,2000))
          }
          "cbr"->{
            val duplicate=ParcelFileDescriptor.dup(pfd.fileDescriptor)
            ParcelFileDescriptor.AutoCloseInputStream(duplicate).use{input->
              BoundedRarEvidence.probe(input,shouldContinue,{SystemClock.elapsedRealtime()},deadline)
            }
          }
          else->throw BoundedArchiveEvidence.ProbeFailure("unsupported-format","Bounded archive evidence is unavailable for this format.")
        }
        if(settled.compareAndSet(false,true)){
          val map=Arguments.createMap()
          evidence.metadataKind?.let{map.putString("metadataKind",it)}
          evidence.metadataText?.let{map.putString("metadataText",it)}
          evidence.coverName?.let{map.putString("coverName",it)}
          evidence.coverBytes?.let{
            map.putString("coverMime",imageMime(evidence.coverName))
            map.putString("coverBase64",Base64.encodeToString(it,Base64.NO_WRAP))
          }
          promise.resolve(map)
        }
      }catch(error:BoundedArchiveEvidence.ProbeFailure){
        if(error.code=="operation-timeout")tripped.set(true)
        if(settled.compareAndSet(false,true))promise.reject(error.code,error.message,error)
      }catch(error:Throwable){
        if(SystemClock.elapsedRealtime()>deadline){
          tripped.set(true)
          if(settled.compareAndSet(false,true))promise.reject("operation-timeout","Archive evidence read exceeded the 2 second deadline.",error)
        }else if(settled.compareAndSet(false,true))promise.reject("archive-probe-failed",error.message,error)
      }finally{
        try{descriptor.getAndSet(null)?.close()}catch(_:Throwable){}
        watchdog.cancel(false)
        cancelActive.compareAndSet(cancel,null)
        busy.set(false)
      }
    }
  }

  private fun openPfd(context:Context,value:String,signal:CancellationSignal):ParcelFileDescriptor{
    val uri=Uri.parse(value)
    return when(uri.scheme){
      "content"->context.contentResolver.openFileDescriptor(uri,"r",signal)
        ?:throw BoundedArchiveEvidence.ProbeFailure("archive-open-failed","Archive cannot be opened.")
      "file"->ParcelFileDescriptor.open(File(uri.path?:throw BoundedArchiveEvidence.ProbeFailure("archive-open-failed","Invalid archive URI.")),ParcelFileDescriptor.MODE_READ_ONLY)
      else->ParcelFileDescriptor.open(File(value),ParcelFileDescriptor.MODE_READ_ONLY)
    }
  }

  private fun imageMime(name:String?):String{
    val lower=String(name?:"").lowercase()
    return when{
      lower.endsWith(".png")->"image/png"
      lower.endsWith(".webp")->"image/webp"
      lower.endsWith(".gif")->"image/gif"
      else->"image/jpeg"
    }
  }
}
