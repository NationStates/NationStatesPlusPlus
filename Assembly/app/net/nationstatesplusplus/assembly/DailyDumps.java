package net.nationstatesplusplus.assembly;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.atomic.AtomicReference;

import net.nationstatesplusplus.assembly.util.DatabaseAccess;

import org.apache.commons.io.IOUtils;
import org.joda.time.DateTime;
import org.joda.time.DateTimeZone;
import org.joda.time.Duration;
import org.joda.time.format.DateTimeFormat;
import org.joda.time.format.DateTimeFormatter;

import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.services.s3.AmazonS3Client;

import play.Logger;

/**
 * <p>
 * Runnable that will check if either the daily region dump or daily nation dump needs an update.
 * Updates occur when there is no daily dump already saved based on the 'Last-Modified' header timestamp
 * Or the daily dump does exist for the timestamp, but the file size does not match the 'content-length'
 * header value.
 * </p><p>
 * Optionally will also upload the daily dump to an AWS S3 bucket "dailydumps", only if credentials
 * are supplied. Otherwise the AWS upload is skipped.
 * </p><p>
 * After the daily dump is downloaded for an update, a new thread to process the daily dump xml is created,
 * see {@link DumpUpdateTask}
 * </p>
 */
public class DailyDumps implements Runnable {
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
				Thread.sleep(Duration.standardMinutes(5).getMillis());
			} catch (InterruptedException e) {
				return;
			}
		}
	}

	/**
	 * File representing the most recent region daily dump
	 * 
	 * @return most recent region dump
	 */
	public File getMostRecentRegionDump() {
		return latestRegionDump.get();
	}

	/**
	 * File representing the most recent nation dump
	 * 
	 * @return most recent nation dump
	 */
	public File getMostRecentNationDump() {
		return latestNationDump.get();
	}

	/**
	 * File representing the directory where region daily dump files will be downloaded and saved to.
	 * 
	 * @return region archive directory
	 */
	public File getRegionArchiveDir() {
		return regionsDir;
	}

	/**
	 * File represengint the directory where the nation daily dump files will be downloaded and saved to.
	 * 
	 * @return nation archive directory
	 */
	public File getNationArchiveDir() {
		return regionsDir;
	}

	/**
	 * Checks to see if an update to the region daily dump, and if so, downloads the update.
	 */
	private void updateRegionsDump() {
		InputStream stream = null;
		try {
			HttpURLConnection conn = (HttpURLConnection)(new URL(REGIONS_URL)).openConnection();
			conn.setRequestProperty("User-Agent", userAgent);
			conn.connect();
			final long contentLength = conn.getContentLengthLong();
			final long time = conn.getHeaderFieldDate("Last-Modified", -1);
			final DateTime serverModified = new DateTime(time, DateTimeZone.forOffsetHours(0)); //set to UTC time
			Logger.info("Checking region dump for {}, length: {}, lastModified: {}", serverModified, contentLength, serverModified);
			
			File regionsDump = new File(regionsDir, serverModified.toString(FILE_DATE) + "-regions.xml.gz");
			latestRegionDump.set(regionsDump);
			
			stream = conn.getInputStream();
			if (!regionsDump.exists() || regionsDump.length() != contentLength) {
				Logger.info("Saving regions dump to " + regionsDump.getAbsolutePath());
				try (FileOutputStream fos = new FileOutputStream(regionsDump)) {
					IOUtils.copy(stream, fos);
					Logger.info("Saved regions dump, size: {}", regionsDump.length());
				}

				if (awsCredentials != null) {
					final AmazonS3Client client = new AmazonS3Client(awsCredentials);
					client.putObject("dailydumps", "regions/" + regionsDump.getName(), regionsDump);
					Logger.info("Successfully uploaded regions dump for {} to s3", serverModified);
				}
			} else {
				Logger.debug("Regions dump is up to date");
			}
		} catch (IOException e) {
			Logger.error("Unable to process regions dump", e);
		} finally {
			IOUtils.closeQuietly(stream);
		}
	}

	/**
	 * Checks to see if an update to the nation daily dump, and if so, downloads the update.
	 * 
	 * Will create a DumpUpdateTask thread after the update is downloaded.
	 */
	private void updateNationsDump() {
		InputStream stream = null;
		try {
			HttpURLConnection conn = (HttpURLConnection)(new URL(NATIONS_URL)).openConnection();
			conn.setRequestProperty("User-Agent", userAgent);
			conn.connect();
			final long contentLength = conn.getContentLengthLong();
			final long time = conn.getHeaderFieldDate("Last-Modified", -1);
			final DateTime serverModified = new DateTime(time, DateTimeZone.forOffsetHours(0)); //set to UTC
			
			Logger.info("Checking nations dump, length: {}, lastModified: {}", contentLength, serverModified);
			File nationsDump = new File(nationsDir, serverModified.toString(FILE_DATE) + "-nations.xml.gz");
			latestNationDump.set(nationsDump);
			
			stream = conn.getInputStream();
			if (!nationsDump.exists() || nationsDump.length() != contentLength) {
				Logger.info("Saving nations dump to " + nationsDump.getAbsolutePath());
				try (FileOutputStream fos = new FileOutputStream(nationsDump)) {
					IOUtils.copy(stream, fos);
					Logger.info("Saved nations dump successfully, size: {}", nationsDump.length());
				}

				if (awsCredentials != null) {
					final AmazonS3Client client = new AmazonS3Client(awsCredentials);
					client.putObject("dailydumps", "nations/" + nationsDump.getName(), nationsDump);
					Logger.info("Successfully uploaded nations dump for {}to s3", serverModified);
				}

				(new Thread(new DumpUpdateTask(access, getMostRecentRegionDump(), nationsDump), "Daily Dump Update Thread")).start();
			} else {
				Logger.debug("Nations dump is up to date");
			}
		} catch (IOException e) {
			Logger.error("Unable to process nations dump", e);
		} finally {
			IOUtils.closeQuietly(stream);
		}
	}
}
