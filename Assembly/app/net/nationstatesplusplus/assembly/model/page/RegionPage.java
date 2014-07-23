package net.nationstatesplusplus.assembly.model.page;

import java.util.HashSet;
import java.util.Set;

import net.nationstatesplusplus.assembly.model.websocket.DataRequest;
import net.nationstatesplusplus.assembly.model.websocket.PageType;
import net.nationstatesplusplus.assembly.model.websocket.RequestType;

public class RegionPage extends NationStatesPage {
	private final Set<Integer> rmbPosts = new HashSet<Integer>();
	private final String region;
	private final int regionId;
	public RegionPage(String region, int regionId) {
		super(PageType.REGION);
		this.region = region;
		this.regionId = regionId;
	}

	public String getRegion() {
		return region;
	}

	public int getRegionId() {
		return regionId;
	}

	@Override
	public boolean isValidUpdate(RequestType type, DataRequest request) {
		if (type == RequestType.RMB_RATINGS) {
			Integer rmbPost = request.getValue("rmb_post_id", null, Integer.class);
			if (rmbPost != null) {
				return rmbPosts.contains(rmbPost);
			}
		} else if (type == RequestType.RMB_MESSAGE || type == RequestType.REGION_HAPPENINGS) {
			return regionId == request.getValue("region", null, Integer.class);
		}
		return super.isValidUpdate(type, request);
	}

	@Override
	public void onRequest(RequestType type, DataRequest request) {
		if (type == RequestType.RMB_RATINGS) {
			rmbPosts.add(request.getValue("rmb_post_id", null, Integer.class));
		}
	}

}
