package com.afforess.assembly;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.Iterator;
import java.util.LinkedHashSet;
import org.apache.commons.dbutils.DbUtils;
import org.joda.time.Duration;

import play.Logger;

import com.afforess.assembly.util.DatabaseAccess;
import com.afforess.assembly.util.Utils;
import com.limewoodMedia.nsapi.NationStates;
import com.limewoodMedia.nsapi.exceptions.RateLimitReachedException;
import com.limewoodMedia.nsapi.exceptions.UnknownRegionException;
import com.limewoodMedia.nsapi.holders.RegionData;

public class FlagUpdateTask implements Runnable{
	private final NationStates api;
	private final DatabaseAccess access;
	private long lastRun = 0;
	private LinkedHashSet<Integer> regionsToUpdate = new LinkedHashSet<Integer>();
	private LinkedHashSet<Integer> nationsToUpdate = new LinkedHashSet<Integer>();
	public FlagUpdateTask(NationStates api, DatabaseAccess access) {
		this.api = api;
		this.access = access;
	}

	@Override
	public void run() {
		if (lastRun + Duration.standardSeconds(30).getMillis() > System.currentTimeMillis()) {
			Logger.info("Skipping flag update run, too soon.");
			return;
		}
		lastRun = System.currentTimeMillis();
		Connection conn = null;
		try {
			final long time = System.currentTimeMillis() - Duration.standardMinutes(2).getMillis();
			
			conn = access.getPool().getConnection();
			PreparedStatement select = conn.prepareStatement("SELECT r.region FROM (assembly.global_happenings AS g LEFT JOIN assembly.regional_happenings AS r ON g.id = r.global_id) WHERE g.type = 41 AND g.timestamp > ? GROUP by g.nation ORDER BY g.timestamp ASC");
			select.setLong(1, time);
			ResultSet result = select.executeQuery();
			while(result.next()) {
				regionsToUpdate.add(result.getInt(1));
			}
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(select);
			
			select = conn.prepareStatement("SELECT nation FROM assembly.global_happenings WHERE type = 7 AND timestamp > ? ORDER BY timestamp ASC");
			select.setLong(1, time);
			result = select.executeQuery();
			while(result.next()) {
				nationsToUpdate.add(result.getInt(1));
			}
			DbUtils.closeQuietly(result);
			DbUtils.closeQuietly(select);
			
			Logger.info(regionsToUpdate.size() + " Region Flag Updates Pending");
			
			Iterator<Integer> iter = regionsToUpdate.iterator();
			for (int i = 0; i < 2 && iter.hasNext(); i++) {
				int region = iter.next();
				
				select = conn.prepareStatement("SELECT name FROM assembly.region WHERE id = ?"); 
				select.setInt(1, region);
				result = select.executeQuery();
				if (result.next()) {
					String name = result.getString(1);
					try {
						RegionData data = api.getRegionInfo(name, RegionData.Shards.FLAG);
						String flag = data.flagURL != null ? data.flagURL : "";
						if (flag.startsWith("http://")) {
							flag = "//" + flag.substring(7);
						}
						PreparedStatement updateFlag = conn.prepareStatement("UPDATE assembly.region SET flag = ? WHERE id = ?"); 
						updateFlag.setString(1, flag);
						updateFlag.setInt(2, region);
						updateFlag.executeUpdate();
						DbUtils.closeQuietly(updateFlag);
					} catch (UnknownRegionException e) {
						Logger.warn("Unknown region: " + name);
					}
				}
				
				DbUtils.closeQuietly(result);
				DbUtils.closeQuietly(select);
				
				iter.remove();
			}
			
			Logger.info(nationsToUpdate.size() + " Nation Flag Updates Pending");
			
			iter = nationsToUpdate.iterator();
			for (int i = 0; i < 2 && iter.hasNext(); i++) {
				int nation = iter.next();
				
				select = conn.prepareStatement("SELECT name FROM assembly.nation WHERE id = ?"); 
				select.setInt(1, nation);
				result = select.executeQuery();
				if (result.next()) {
					String name = result.getString(1);
					
					Utils.updateNation(conn, access, api, name, nation);
				}
				
				DbUtils.closeQuietly(result);
				DbUtils.closeQuietly(select);
				
				iter.remove();
			}
		} catch (RateLimitReachedException e) {
			Logger.warn("flag update task rate limited!");
		} catch (Exception e) {
			Logger.error("Unable to execute flag update task", e);
		} finally {
			DbUtils.closeQuietly(conn);
		}
	}
}
