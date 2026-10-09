package app.archivist.reader;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import java.util.*;

public final class ArchivistScannerPackage implements ReactPackage {
  @Override public List<NativeModule> createNativeModules(ReactApplicationContext context){return Collections.singletonList(new ArchivistScannerModule(context));}
  @Override public List<ViewManager> createViewManagers(ReactApplicationContext context){return Collections.emptyList();}
}
