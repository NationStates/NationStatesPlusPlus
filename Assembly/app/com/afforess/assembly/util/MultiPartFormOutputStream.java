package com.afforess.assembly.util;

import java.io.DataOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;
 
public class MultiPartFormOutputStream {

	private static final String NEWLINE = "\r\n";
 
	private static final String PREFIX = "--";
 
	private DataOutputStream out = null;
 
	private String boundary = null;
 
	public MultiPartFormOutputStream(OutputStream os, String boundary) {
		if(os == null) {
			throw new IllegalArgumentException("Output stream is required.");
		}
		if(boundary == null || boundary.length() == 0) {
			throw new IllegalArgumentException("Boundary stream is required.");
		}
		this.out = new DataOutputStream(os);
		this.boundary = boundary;
	}
 
	public void writeField(String name, boolean value) throws java.io.IOException {
		writeField(name, new Boolean(value).toString());
	}
 
	public void writeField(String name, double value) throws java.io.IOException {
		writeField(name, Double.toString(value));
	}
 
	public void writeField(String name, float value) throws java.io.IOException {
		writeField(name, Float.toString(value));
	}
 
	public void writeField(String name, long value) throws java.io.IOException {
		writeField(name, Long.toString(value));
	}
 
	public void writeField(String name, int value) throws java.io.IOException {
		writeField(name, Integer.toString(value));
	}
 
	public void writeField(String name, short value) throws java.io.IOException {
		writeField(name, Short.toString(value));
	}
 
	public void writeField(String name, char value) throws java.io.IOException {
		writeField(name, new Character(value).toString());
	}
 
	public void writeField(String name, String value) throws java.io.IOException {
		if(name == null) {
			throw new IllegalArgumentException("Name cannot be null or empty.");
		}
		if(value == null) {
			value = "";
		}
		out.writeBytes(PREFIX);
		out.writeBytes(boundary);
		out.writeBytes(NEWLINE);
		out.writeBytes("Content-Disposition: form-data; name=\"" + name + "\"");
		out.writeBytes(NEWLINE);
		out.writeBytes(NEWLINE);
		out.writeBytes(value);
		out.writeBytes(NEWLINE);
		out.flush();
	}
 
	public void writeFile(String name, String mimeType, File file) throws java.io.IOException {
		if(file == null) {
			throw new IllegalArgumentException("File cannot be null.");
		}
		if(!file.exists()) {
			throw new IllegalArgumentException("File does not exist.");
		}
		if(file.isDirectory()) {
			throw new IllegalArgumentException("File cannot be a directory.");
		}
		writeFile(name, mimeType, file.getCanonicalPath(), new FileInputStream(file));
	}
 
	public void writeFile(String name, String mimeType, String fileName, InputStream is) throws java.io.IOException {
		if(is == null) {
			throw new IllegalArgumentException("Input stream cannot be null.");
		}
		if(fileName == null || fileName.length() == 0) {
			throw new IllegalArgumentException("File name cannot be null or empty.");
		}
		out.writeBytes(PREFIX);
		out.writeBytes(boundary);
		out.writeBytes(NEWLINE);
		out.writeBytes("Content-Disposition: form-data; name=\"" + name + "\"; filename=\"" + fileName + "\"");
		out.writeBytes(NEWLINE);
		if(mimeType != null) {
			out.writeBytes("Content-Type: " + mimeType);
			out.writeBytes(NEWLINE);
		}
		out.writeBytes(NEWLINE);
		byte[] data = new byte[1024];
		int r = 0;
		while((r = is.read(data, 0, data.length)) != -1) {
			out.write(data, 0, r);
		}
		try {
			is.close();
		} catch(Exception e) {}
		out.writeBytes(NEWLINE);
		out.flush();
	}
 
	public void writeFile(String name, String mimeType, String fileName, byte[] data) throws java.io.IOException {
		if(data == null) {
			throw new IllegalArgumentException("Data cannot be null.");
		}
		if(fileName == null || fileName.length() == 0) {
			throw new IllegalArgumentException("File name cannot be null or empty.");
		}
		out.writeBytes(PREFIX);
		out.writeBytes(boundary);
		out.writeBytes(NEWLINE);
		out.writeBytes("Content-Disposition: form-data; name=\"" + name + "\"; filename=\"" + fileName + "\"");
		out.writeBytes(NEWLINE);
		if(mimeType != null) {
			out.writeBytes("Content-Type: " + mimeType);
			out.writeBytes(NEWLINE);
		}
		out.writeBytes(NEWLINE);
		out.write(data, 0, data.length);
		out.writeBytes(NEWLINE);
		out.flush();
	}
 
	public void flush() throws java.io.IOException {
		// out.flush();
	}
 
	public void close() throws java.io.IOException {
		out.writeBytes(PREFIX);
		out.writeBytes(boundary);
		out.writeBytes(PREFIX);
		out.writeBytes(NEWLINE);
		out.flush();
		out.close();
	}
 
	public String getBoundary() {
		return this.boundary;
	}
 
	public static URLConnection createConnection(URL url) throws java.io.IOException {
		URLConnection urlConn = url.openConnection();
		if(urlConn instanceof HttpURLConnection) {
			HttpURLConnection httpConn = (HttpURLConnection)urlConn;
			httpConn.setRequestMethod("POST");
		}
		urlConn.setDoInput(true);
		urlConn.setDoOutput(true);
		urlConn.setUseCaches(false);
		urlConn.setDefaultUseCaches(false);
		return urlConn;
	}
 
	public static String createBoundary() {
		return "--------------------" +	Long.toString(System.currentTimeMillis(), 16);
	}
 
	public static String getContentType(String boundary) {
		return "multipart/form-data; boundary=" + boundary;
	}
}