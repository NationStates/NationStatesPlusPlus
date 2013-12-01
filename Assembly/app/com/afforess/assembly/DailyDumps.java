package com.afforess.assembly;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import org.apache.commons.io.IOUtils;
import org.joda.time.DateTime;
import org.joda.time.DateTimeZone;
import org.joda.time.format.DateTimeFormat;
import org.joda.time.format.DateTimeFormatter;

import com.afforess.assembly.util.DatabaseAccess;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.s3.AmazonS3Client;

import play.Logger;
import play.libs.Akka;
import scala.concurrent.duration.Duration;

public class DailyDumps implements Runnable{
	private static final DateTimeFormatter FILE_DATE = DateTimeFormat.forPattern("yyyy-MM-dd");
	private static final String REGIONS_URL = "http://www.nationstates.net/pages/regions.xml.gz";
	private static final String NATIONS_URL = "http://www.nationstates.net/pages/nations.xml.gz";
	
	private final AtomicReference<File> latestRegionDump = new AtomicReference<File>();
	private final AtomicReference<File> latestNationDump = new AtomicReference<File>();
	private final File regionsDir;
	private final File nationsDir;
	private final DatabaseAccess access;
	private final String userAgent;
	private final BasicAWSCredentials awsCredentials;
	public DailyDumps(DatabaseAccess access, File directory, String userAgent, BasicAWSCredentials awsCredentials) {
		this.access = access;
		this.userAgent = userAgent;
		regionsDir = new File(directory, "regions");
		regionsDir.mkdirs();
		nationsDir = new File(directory, "nations");
		nationsDir.mkdirs();
		this.awsCredentials = awsCredentials;
	}

	@Override
	public void run() {
		while(true) {
			updateRegionsDump();
			updateNationsDump();
			try {
				Thread.sleep(60000L * 60);
			} catch (InterruptedException e) {
				return;
			}
		}
	}

	public File getMostRecentRegionDump() {
		return latestRegionDump.get();
	}

	public File getMostRecentNationDump() {
		return latestNationDump.get();
	}

	public File getRegionArchiveDir() {
		return regionsDir;
	}

	public File getNationArchiveDir() {
		return regionsDir;
	}

	private void updateRegionsDump() {
		InputStream stream = null;
		try {
			HttpURLConnection conn = (HttpURLConnection)(new URL(REGIONS_URL)).openConnection();
			conn.setRequestProperty("User-Agent", userAgent);
			conn.connect();
			long contentLength = conn.getContentLengthLong();
			long time = conn.getHeaderFieldDate("Last-Modified", -1);
			DateTime serverModified = new DateTime(time, DateTimeZone.forOffsetHours(0));
			
			Logger.info("Checking region dump, length: " + contentLength + " lastModified: " + serverModified);
			File regionsDump = new File(regionsDir, serverModified.toString(FILE_DATE) + "-regions.xml.gz");
			latestRegionDump.set(regionsDump);
			stream = conn.getInputStream();
			if (!regionsDump.exists() || regionsDump.length() != contentLength) {
				Logger.info("Saving regions dump to " + regionsDump.getAbsolutePath());
				FileOutputStream fos = null;
				try {
					fos = new FileOutputStream(regionsDump);
					IOUtils.copy(stream, fos);
					Logger.info("Saved regions dump successfully, size: " + regionsDump.length());
					
					if (awsCredentials != null) {
						final AmazonS3Client client = new AmazonS3Client(awsCredentials);
						client.putObject("dailydumps", "regions/" + regionsDump.getName(), regionsDump);
						Logger.info("Successfully Uploaded regions dump to s3");
					}
				} finally {
					IOUtils.closeQuietly(fos);
				}
			} else {
				Logger.info("Regions dump is up to date");
			}
		} catch (IOException e) {
			Logger.error("Unable to process regions dump", e);
		} finally {
			IOUtils.closeQuietly(stream);
		}
	}

	private void updateNationsDump() {
		InputStream stream = null;
		try {
			HttpURLConnection conn = (HttpURLConnection)(new URL(NATIONS_URL)).openConnection();
			conn.setRequestProperty("User-Agent", userAgent);
			conn.connect();
			long contentLength = conn.getContentLengthLong();
			long time = conn.getHeaderFieldDate("Last-Modified", -1);
			DateTime serverModified = new DateTime(time, DateTimeZone.forOffsetHours(0));
			
			Logger.info("Checking nations dump, length: " + contentLength + " lastModified: " + serverModified);
			File nationsDump = new File(nationsDir, serverModified.toString(FILE_DATE) + "-nations.xml.gz");
			latestNationDump.set(nationsDump);
			stream = conn.getInputStream();
			if (!nationsDump.exists() || nationsDump.length() != contentLength) {
				Logger.info("Saving nations dump to " + nationsDump.getAbsolutePath());
				FileOutputStream fos = null;
				try {
					fos = new FileOutputStream(nationsDump);
					IOUtils.copy(stream, fos);
					Logger.info("Saved nations dump successfully, size: " + nationsDump.length());
					
					if (awsCredentials != null) {
						final AmazonS3Client client = new AmazonS3Client(awsCredentials);
						client.putObject("dailydumps", "nations/" + nationsDump.getName(), nationsDump);
						Logger.info("Successfully Uploaded nations dump to s3");
					}
					Akka.system().scheduler().scheduleOnce(Duration.create(60, TimeUnit.SECONDS), new DumpUpdateTask(access, getMostRecentRegionDump(), nationsDump), Akka.system().dispatcher());
				} finally {
					IOUtils.closeQuietly(fos);
				}
			} else {
				Logger.info("Nations dump is up to date");
			}
		} catch (IOException e) {
			Logger.error("Unable to process nations dump", e);
		} finally {
			IOUtils.closeQuietly(stream);
		}
	}
}
