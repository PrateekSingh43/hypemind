import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Request, Response } from "express";

jest.mock("./workspace.service", () => ({
	getBootstrap: jest.fn(),
	createItem: jest.fn(),
	getItem: jest.fn(),
	updateItemById: jest.fn(),
	pinItem: jest.fn(),
	getInbox: jest.fn(),
}));

import * as workspaceService from "./workspace.service";
import {
	bootstrapController,
	createItemController,
	getInboxController,
	getItemController,
	pinItemController,
	updateItemController,
} from "./workspace.controller";

function createMockResponse() {
	const res = {} as Response & {
		status: jest.Mock;
		json: jest.Mock;
	};
	res.status = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);
	return res;
}

describe("workspace.controller", () => {
	const mockedService = workspaceService as jest.Mocked<typeof workspaceService>;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("returns bootstrap payload used by sidebar/dashboard", async () => {
		const payload = {
			workspace: { id: "w1", name: "HypeMind" },
			areas: [{ id: "a1", title: "Gym", projectsCount: 0 }],
			pinned: [],
			pinnedItems: [],
			inboxCount: 1,
			recentItems: [],
			settings: { prefs: {} },
		};
		mockedService.getBootstrap.mockResolvedValue(payload as any);

		const req = {
			params: { workspaceId: "w1" },
			user: { id: "u1", email: "u@x.com", name: "U" },
		} as unknown as Request;
		const res = createMockResponse();
		const next = jest.fn();

		await bootstrapController(req, res, next);

		expect(mockedService.getBootstrap).toHaveBeenCalledWith("w1", "u1");
		expect(res.json).toHaveBeenCalledWith({ success: true, data: payload });
	});

	it("creates a quick-capture item and returns 201", async () => {
		const created = { id: "itm_1", workspaceId: "w1", type: "QUICK_NOTE" };
		mockedService.createItem.mockResolvedValue(created as any);

		const req = {
			params: { workspaceId: "w1" },
			body: {
				type: "QUICK_NOTE",
				title: "New note",
				description: "test",
				source: null,
				tags: ["x"],
				projectId: null,
			},
			user: { id: "u1", email: "u@x.com", name: "U" },
		} as unknown as Request;
		const res = createMockResponse();
		const next = jest.fn();

		await createItemController(req, res, next);

		expect(mockedService.createItem).toHaveBeenCalledWith(
			"w1",
			"u1",
			expect.objectContaining({
				type: "QUICK_NOTE",
				title: "New note",
				description: "test",
				tags: ["x"],
			})
		);
		expect(res.status).toHaveBeenCalledWith(201);
		expect(res.json).toHaveBeenCalledWith({ success: true, data: created });
	});

	it("returns item by id", async () => {
		const item = { id: "itm_abc", workspaceId: "w1", title: "Test", type: "QUICK_NOTE" };
		mockedService.getItem.mockResolvedValue(item as any);

		const req = {
			params: { id: "itm_abc" },
			user: { id: "u1", email: "u@x.com", name: "U" },
		} as unknown as Request;
		const res = createMockResponse();
		const next = jest.fn();

		await getItemController(req, res, next);

		expect(mockedService.getItem).toHaveBeenCalledWith("itm_abc", "u1");
		expect(res.json).toHaveBeenCalledWith({ success: true, data: item });
	});

	it("updates item metadata/content by item id route", async () => {
		const updated = { id: "itm_abc", title: "Updated" };
		mockedService.updateItemById.mockResolvedValue(updated as any);

		const req = {
			params: { id: "itm_abc" },
			body: {
				title: "Updated",
				metadata: { description: "updated" },
			},
			user: { id: "u1", email: "u@x.com", name: "U" },
		} as unknown as Request;
		const res = createMockResponse();
		const next = jest.fn();

		await updateItemController(req, res, next);

		expect(mockedService.updateItemById).toHaveBeenCalledWith(
			"itm_abc",
			"u1",
			expect.objectContaining({ title: "Updated" })
		);
		expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });
	});

	it("pins and unpins item with compact success response", async () => {
		mockedService.pinItem.mockResolvedValue({ isPinned: true } as any);

		const req = {
			params: { id: "itm_abc" },
			body: { isPinned: true },
			user: { id: "u1", email: "u@x.com", name: "U" },
		} as unknown as Request;
		const res = createMockResponse();
		const next = jest.fn();

		await pinItemController(req, res, next);

		expect(mockedService.pinItem).toHaveBeenCalledWith("itm_abc", "u1", true);
		expect(res.json).toHaveBeenCalledWith({ success: true, isPinned: true });
	});

	it("returns paginated inbox payload", async () => {
		const inbox = { items: [{ id: "itm_1" }], nextCursor: "itm_1" };
		mockedService.getInbox.mockResolvedValue(inbox as any);

		const req = {
			params: { workspaceId: "w1" },
			query: { limit: "10", cursor: "itm_0" },
		} as unknown as Request;
		const res = createMockResponse();
		const next = jest.fn();

		await getInboxController(req, res, next);

		expect(mockedService.getInbox).toHaveBeenCalledWith("w1", {
			limit: 10,
			cursor: "itm_0",
		});
		expect(res.json).toHaveBeenCalledWith({ success: true, data: inbox });
	});
});
