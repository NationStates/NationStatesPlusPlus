package net.nationstatesplusplus.assembly;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import play.Logger;
import net.nationstatesplusplus.assembly.model.RecruitmentType;
import net.nationstatesplusplus.assembly.util.DatabaseAccess;

public class RecruitmentTargetTask implements Runnable {
	private static final int DEFAULT_NUM_TARGETS = 1500;

	private final RecruitmentType type;
	private final DatabaseAccess access;

	public RecruitmentTargetTask(RecruitmentType type, DatabaseAccess access) {
		this.type = type;
		this.access = access;
	}

	@Override
	public void run() {
		try {
			final long start = System.currentTimeMillis();
			updateRecruitmentTargets();

			Logger.info("Completed update of recruitment targets of {} in {} ms", type.name(), (System.currentTimeMillis() - start));
		} catch (Exception e) {
			Logger.error("Exception while updating recruitment targets", e);
		}
	}

	private void updateRecruitmentTargets() throws SQLException {
		try (Connection conn = access.getPool().getConnection()) {
			conn.setAutoCommit(false);
			try {
				try (PreparedStatement delete = conn.prepareStatement("DELETE FROM assembly.recruitment_targets WHERE recruitment_type = ?")) {
					delete.setInt(1, type.getId());
					delete.executeUpdate();
				}
				try (PreparedStatement select = type.createRecruitmentStatement(conn)) {
					select.setInt(1, -1);
					select.setInt(2, 0);
					select.setInt(3, DEFAULT_NUM_TARGETS);

					try (PreparedStatement insertBatch = conn.prepareStatement("INSERT INTO assembly.recruitment_targets (nation_id, nation_name, region_id, recruitment_type) VALUES (?, ?, ?, ?)")) {
						try (ResultSet set = select.executeQuery()) {
							while (set.next()) {
								final int nationId = set.getInt("id");
								final String name = set.getString("name");
								final int regionId = set.getInt("region");
								
								if (!RecruitmentType.isSpamNation(name)) {
									insertBatch.setInt(1, nationId);
									insertBatch.setString(2, name);
									insertBatch.setInt(3, regionId);
									insertBatch.setInt(4, type.getId());
									insertBatch.addBatch();
								}
							}
						}
						insertBatch.executeBatch();
					}
				}
				conn.commit();
			} finally {
				conn.setAutoCommit(true);
			}
		}
	}
}
