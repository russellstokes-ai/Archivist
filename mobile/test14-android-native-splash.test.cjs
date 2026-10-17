const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');
const app=path.join(__dirname,'android/app/src/main');
const styles=fs.readFileSync(path.join(app,'res/values/styles.xml'),'utf8');
const colors=fs.readFileSync(path.join(app,'res/values/colors.xml'),'utf8');
const native=fs.readFileSync(path.join(app,'res/drawable/archivist_native_splash.xml'),'utf8');
assert.match(styles,/<style name="Theme\.App\.SplashScreen" parent="AppTheme">/);
assert.match(styles,/<item name="android:windowBackground">@drawable\/archivist_native_splash<\/item>/);
assert(!styles.includes('<item name="android:windowBackground">@drawable/splashscreen_logo</item>'),
  'The raw PNG must never become an unrestricted full-window background');
assert.match(native,/<layer-list xmlns:android="http:\/\/schemas\.android\.com\/apk\/res\/android">/);
assert.match(native,/<item android:drawable="@color\/splashscreen_background"\/>/);
assert.match(colors,/<color name="splashscreen_background">#2F8B86<\/color>/);
assert.match(native,/<item android:width="112dp" android:height="112dp" android:gravity="center">/);
assert.match(native,/<bitmap android:src="@drawable\/splashscreen_logo" android:gravity="fill"\/>/);
assert(!/android:tileMode|android:gravity="fill"[^>]*<item/.test(native),
  'Image is bounded by the 112dp layer, not tiled or stretched across the screen');
for(const dpi of ['mdpi','hdpi','xhdpi','xxhdpi','xxxhdpi']){
 const file=fs.readFileSync(path.join(app,'res/drawable-'+dpi+'/splashscreen_logo.png'));
 assert(file.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),dpi+' must retain approved PNG');
}
const mdpi=fs.readFileSync(path.join(app,'res/drawable-mdpi/splashscreen_logo.png'));
const actual=crypto.createHash('sha1').update('blob '+mdpi.length+'\0').update(mdpi).digest('hex');
assert.equal(actual,'2aa50fdd948dc9107c2ac1de9328001b4ca42a08',
 'Do not replace/alter the approved navy/gold A in any native launch work');
console.log('PASS: pure-teal bounded, centred 112dp OS splash; all original density art retained and mdpi byte-locked');
