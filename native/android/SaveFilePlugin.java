package com.divriz.ai;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/** Streams a file (in base64 chunks) into the public Downloads/DIVRIZ folder via MediaStore. */
@CapacitorPlugin(name = "SaveFile")
public class SaveFilePlugin extends Plugin {
    private OutputStream out;
    private Uri uri;
    private String displayName;

    @PluginMethod
    public void open(PluginCall call) {
        try {
            String name = call.getString("name", "divriz.mp4");
            String mime = call.getString("mime", "video/mp4");
            ContentResolver resolver = getContext().getContentResolver();
            if (Build.VERSION.SDK_INT >= 29) {
                ContentValues v = new ContentValues();
                v.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
                v.put(MediaStore.MediaColumns.MIME_TYPE, mime);
                v.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/DIVRIZ");
                v.put(MediaStore.MediaColumns.IS_PENDING, 1);
                uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, v);
                if (uri == null) { call.reject("MediaStore insert failed"); return; }
                out = resolver.openOutputStream(uri);
            } else {
                File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "DIVRIZ");
                dir.mkdirs();
                File f = new File(dir, name);
                out = new FileOutputStream(f);
                uri = Uri.fromFile(f);
            }
            displayName = name;
            call.resolve();
        } catch (Exception e) {
            call.reject("open failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void write(PluginCall call) {
        try {
            if (out == null) { call.reject("not opened"); return; }
            byte[] bytes = Base64.decode(call.getString("data", ""), Base64.DEFAULT);
            out.write(bytes);
            call.resolve();
        } catch (Exception e) {
            call.reject("write failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void close(PluginCall call) {
        try {
            if (out != null) { out.flush(); out.close(); out = null; }
            if (Build.VERSION.SDK_INT >= 29 && uri != null) {
                ContentValues v = new ContentValues();
                v.put(MediaStore.MediaColumns.IS_PENDING, 0);
                getContext().getContentResolver().update(uri, v, null, null);
            }
            JSObject ret = new JSObject();
            ret.put("path", "Downloads/DIVRIZ/" + displayName);
            ret.put("uri", String.valueOf(uri));
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("close failed: " + e.getMessage());
        }
    }
}
