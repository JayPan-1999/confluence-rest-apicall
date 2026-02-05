import axios, { AxiosInstance } from "axios";

export interface ConfluencePageStatus {
    id: string;
    name: string;
    color: string;
}

export interface ConfluenceWebhookEvent {
    eventType: string;
    user?: {
        displayName: string;
        userKey: string;
        email: string;
    };
    page?: {
        id: string;
        title: string;
        status: string;
        url: string;
        space: {
            key: string;
            name: string;
        };
        version: {
            number: number;
        };
    };
    group?: {
        id: string;
        name: string;
    };
    buttonType?: "approve" | "reject";
    spaceKey?: string;
    originState?: States_Enum;
    authorName?: string;
    actions?: {
        changeStatusTo: States_Enum;
    };
}

enum Email_Template {
    Draft_to_ITL_Reviewer = `Dear internal reviewer,

SOP "[SOP Name]" has been UPDATED and sent for your review. Please review and provide your approval/reject for this to proceed further.
If you want to reject, leave your comments and click "Reject" button in the page.
If you want to approve, click "Approve" for it to move forward.

In case you want to know where the changes are, you can either confirm with the editor or look up in the version history.
Please review the SOP by click below link:
[link]

Regards,
JSC Knowledge Center`,
    ITL_Reviewer_to_BU_Reviewer = `Dear BU reviewer,

SOP "[SOP Name]" has been UPDATED, approved by internal reviewer and sent for your review. Please review and provide your approval/reject for this to proceed further. 
If you want to reject, leave your comments and click "Reject" button in the page.
If you want to approve, click "Approve" for it to move forward.

In case you want to know where the changes are, you can either confirm with the editor or look up in the version history.

Please review the SOP by click below link:
[link]

Regards,
JSC Knowledge Center`,
    ITL_Reviewer_to_Draft = `Dear SOP Draft Editor,

SOP "[SOP Name]" has been REJECTED by Internal reviewer. Please review and update the SOP accordingly before submit it again.

You can find the comments for rejection from the reviewer. Connect with reviewer if nothing's been left.

Please review the SOP by click below link:
[link]

Regards,
JSC Knowledge Center`,
    BU_Reviewer_to_Draft = `Dear SOP Draft Editor,

SOP "[SOP Name]" has been REJECTED by BU reviewer. Please review and update the SOP accordingly before submit it again.

You can find the comments for rejection from the reviewer. Connect with reviewer if nothing's been left.

Please review the SOP by click below link:
[link]

Regards,
JSC Knowledge Center`,
    BU_Reviewer_to_Published = `Dear all,

SOP "[SOP Name]" has been updated and Approved by all approver. 

It's now officially PUBLISHED.

You may visit the SOP by click below link:
[link]

Regards,
JSC Knowledge Center`,
}

enum States_Enum {
    DRAFT = "Draft",
    PENDING_ITL_REVIEW = "Pending JSC Review",
    PENDING_BU_REVIEW = "Pending BU Review",
    PUBLISHED = "Published",
}

type Page_Action = "approve" | "reject" | "re-review";

function extractContentInParentheses(str: string): string {
    // 正则表达式解释：
    // \( 匹配左括号 (
    // (.*?) 非贪婪匹配括号内的任意内容，并捕获这个分组
    // \) 匹配右括号 )
    const regex = /\((.*?)\)/;

    // 执行匹配
    const match = str.match(regex);

    // 处理匹配结果：有匹配则返回括号内内容，无匹配返回空字符串
    return match ? match[1] : "";
}

export class ConfluenceService {
    private client: AxiosInstance;

    constructor() {
        const baseURL = process.env.CONFLUENCE_SERVICE_ACCOUNT_BASE_URL;
        const username = process.env.CONFLUENCE_USERNAME;
        const apiToken = process.env.CONFLUENCE_API_TOKEN;

        if (!baseURL || !username || !apiToken) {
            throw new Error(
                "Missing Confluence configuration in environment variables",
            );
        }

        this.client = axios.create({
            baseURL: `${baseURL}/wiki`,
            auth: {
                username: username,
                password: apiToken,
            },
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });
    }

    /**
     * 获取全部页面
     */
    async getAllPage(): Promise<any> {
        try {
            const response = await this.client.get(`/api/v2/pages`);
            return response.data;
        } catch (error) {
            console.error("Error fetching page:", error);
            throw error;
        }
    }

    /**
     * 获取所有群组
     */
    async getAllGroups(): Promise<any> {
        try {
            const response = await this.client.get(`/rest/api/group`);
            return response.data;
        } catch (error) {
            console.error("Error fetching groups:", error);
            throw error;
        }
    }
    /**
     * 获取特定条件的群组
     */
    async getGroupsByCondition(condition: any): Promise<any> {
        try {
            const response = await this.client.get(`/rest/api/group/picker`, {
                params: {
                    query: condition,
                },
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching groups by condition:", error);
            throw error;
        }
    }

    /**
     * 获取对应群组信息
     */
    async getGroupInfo(groupId: string): Promise<any> {
        try {
            const response = await this.client.get(
                `/rest/api/group/${groupId}/membersByGroupId`,
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching group info:", error);
            throw error;
        }
    }

    /**
     * 获取页面信息 By ID
     */
    async getPageById(
        pageId: string,
        otherParams?: { versionNumber?: number; bodyFormat?: string },
    ): Promise<any> {
        try {
            const response = await this.client.get(
                `/rest/api/content/${pageId}`,
                {
                    params: {
                        version: otherParams?.versionNumber,
                        "body-format": otherParams?.bodyFormat,
                        status: "current",
                        expand: "body.storage,version,space",
                    },
                },
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching page:", error);
            throw error;
        }
    }

    /**
     * 获取所有状态的id
     */
    async getAllPageStatusIds(): Promise<any> {
        try {
            const response = await this.client.get(`/rest/api/content-states`);
            return response.data;
        } catch (error) {
            console.error("Error fetching all page status IDs:", error);
            throw error;
        }
    }

    /**
     * 获取页面状态
     */
    async getPageStatus(pageId: string): Promise<any> {
        try {
            const state = await this.client.get(
                `/rest/api/content/${pageId}/state`,
            );
            return state;
        } catch (error) {
            console.error("Error fetching page status:", error);
            throw error;
        }
    }

    /**
     * 获取空间所有页面状态
     */
    async getAllPageStates(spaceKey: string): Promise<any> {
        try {
            const response = await this.client.get(
                `/rest/api/space/${spaceKey}/state/settings`,
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching all page states:", error);
            throw error;
        }
    }

    /**
     * 修改页面状态
     */
    async changePageStatus(
        pageId: string,
        curState: string,
        spaceKey: string,
    ): Promise<any> {
        try {
            const { spaceContentStates } =
                await this.getAllPageStates(spaceKey);
            const id = spaceContentStates.find(
                (state: any) =>
                    state.name.toLowerCase() === curState.toLowerCase(),
            )?.id;
            if (!id) {
                throw new Error(
                    `State "${curState}" not found in space "${spaceKey}"`,
                );
            }
            const response = await this.client.put(
                `/rest/api/content/${pageId}/state?status=current`,
                {
                    id,
                },
            );
            return response.data;
        } catch (error) {
            console.error("Error changing page status:", error);
            throw error;
        }
    }

    /**
     * 更新页面状态
     */
    async updatePageStatus(pageId: string, status: string): Promise<any> {
        try {
            // 首先获取当前页面信息
            const currentPage = await this.getPageById(pageId);

            // 更新页面状态
            const updateData = {
                id: pageId,
                type: currentPage.type,
                title: currentPage.title,
                status: status,
                space: {
                    key: currentPage.space.key,
                },
                version: {
                    number: currentPage.version.number + 1,
                },
                body: currentPage.body,
            };

            const response = await this.client.put(
                `/content/${pageId}`,
                updateData,
            );
            return response.data;
        } catch (error) {
            console.error("Error updating page status:", error);
            throw error;
        }
    }

    /**
     * 获取页面的标签
     */
    async getPageLabels(pageId: string): Promise<any> {
        try {
            const response = await this.client.get(
                `/api/v2/pages/${pageId}/labels`,
            );
            return response.data;
        } catch (error) {
            console.error("Error fetching page labels:", error);
            throw error;
        }
    }

    /**
     * 获取所有父页面拼接的标题(废弃)
     */

    async getFullPageTitle(
        pageId: string,
    ): Promise<{ groupname: string; states: any }> {
        try {
            let titles: string[] = [];
            let currentPageId: string | null = pageId;
            const states = await this.getPageStatus(pageId);
            while (currentPageId) {
                const page = await this.getPageById(currentPageId);
                titles.unshift(page.title);
                currentPageId = page.parentId;
            }
            const wholeTitles = titles.slice(1, titles.length - 1).join("-");
            return { groupname: wholeTitles, states };
        } catch (error) {
            console.error("Error fetching full page title:", error);
            throw error;
        }
    }

    async getNewGroupAndPageName(
        pageId: string,
    ): Promise<{ groupname: string; states: any; pageTitle: string }> {
        try {
            const states = await this.getPageStatus(pageId);
            const page = await this.getPageById(pageId);
            return {
                states,
                groupname: extractContentInParentheses(page.title),
                pageTitle: page.title,
            };
        } catch (error) {
            console.error("Error fetching new group name:", error);
            throw error;
        }
    }

    /**
     * 获取群组的emails
     */
    async getGroupEmails(groupname: string) {
        try {
            // 获取对应群组信息
            const allGroups = await this.getGroupsByCondition(groupname);
            const [groupInfo] = allGroups.results;
            // 获取对应群组成员信息
            const members = await this.getGroupInfo(groupInfo.id);
            // 获取成员邮箱
            const emails = members.results
                .map((member: any) => member.email)
                .join(",");
            return emails;
        } catch (error) {
            console.error("Error fetching group emails:", error);
            throw error;
        }
    }

    /**
     * 根据请求类型获取当前需要发送邮件的群组
     */
    async getGroupNameAndStateByButtonType(
        pageId: string,
        buttonType?: Page_Action,
        originState?: States_Enum,
    ): Promise<{
        newState?: string;
        toGroups: string[];
        ccGroups: string[];
        pageTitle: string;
    }> {
        try {
            // 获取全部页面标题
            let { groupname, states, pageTitle } =
                await this.getNewGroupAndPageName(pageId);
            let currentState = states.data.contentState.name;
            let toGroups = [];
            let ccGroups = [];
            const JSC_GROUP_NAME = groupname + "_JSC Approver";
            const BU_GROUP_NAME = groupname + "_BU Approver";
            const Editor_GROUP_NAME = groupname + "_Editor";
            if (currentState === States_Enum.PENDING_ITL_REVIEW) {
                toGroups = [JSC_GROUP_NAME];
                ccGroups = [Editor_GROUP_NAME];
            }
            if (currentState === States_Enum.PENDING_BU_REVIEW) {
                toGroups = [BU_GROUP_NAME];
                ccGroups = [JSC_GROUP_NAME];
            }
            if (currentState === States_Enum.PUBLISHED) {
                toGroups = [Editor_GROUP_NAME, JSC_GROUP_NAME, BU_GROUP_NAME];
                ccGroups = [];
            }
            if (currentState === States_Enum.DRAFT) {
                if (originState === States_Enum.PENDING_ITL_REVIEW) {
                    toGroups = [Editor_GROUP_NAME];
                    ccGroups = [JSC_GROUP_NAME];
                }
                if (originState === States_Enum.PENDING_BU_REVIEW) {
                    toGroups = [Editor_GROUP_NAME];
                    ccGroups = [BU_GROUP_NAME, JSC_GROUP_NAME];
                }
            }
            return { toGroups, ccGroups, pageTitle };
        } catch (error) {
            console.error("Error fetching group name by button type:", error);
            throw error;
        }
    }

    /**
     * 添加footer评论
     */
    async addFooterComment(pageId: string, commentBody: string): Promise<any> {
        try {
            const response = await this.client.post(`/api/v2/footer-comments`, {
                pageId,
                body: {
                    storage: {
                        value: commentBody,
                        representation: "storage",
                    },
                },
            });
            return response.data;
        } catch (error) {
            console.error("Error adding footer comment:", error);
            throw error;
        }
    }

    getEmailTemplate(
        buttonType: Page_Action,
        originState: States_Enum,
        pageTitle: string,
        pageUrl: string,
    ): string {
        let template = "";
        if (buttonType === "approve") {
            if (originState === States_Enum.DRAFT) {
                template = Email_Template.Draft_to_ITL_Reviewer;
            }
            if (originState === States_Enum.PENDING_ITL_REVIEW) {
                template = Email_Template.ITL_Reviewer_to_BU_Reviewer;
            }
            if (originState === States_Enum.PENDING_BU_REVIEW) {
                template = Email_Template.BU_Reviewer_to_Published;
            }
        }
        if (buttonType === "reject") {
            if (originState === States_Enum.PENDING_ITL_REVIEW) {
                template = Email_Template.ITL_Reviewer_to_Draft;
            }
            if (originState === States_Enum.PENDING_BU_REVIEW) {
                template = Email_Template.BU_Reviewer_to_Draft;
            }
        }
        if (buttonType === "re-review") {
            template = Email_Template.Draft_to_ITL_Reviewer;
        }
        return template
            .replace("[link]", pageUrl)
            .replace("[SOP Name]", pageTitle);
    }

    async getIsPageChanged(pageId: string): Promise<boolean> {
        const currentPageData = await this.getPageById(pageId, {
            bodyFormat: "storage",
        });
        const previousVersionNumber = currentPageData.version.number - 1;
        const previousVersionData = await this.getPageById(pageId, {
            versionNumber: previousVersionNumber,
            bodyFormat: "storage",
        });
        const isChanged =
            currentPageData.body.storage.value !==
            previousVersionData.body.storage.value;
        return isChanged;
    }

    /**
     * 根据事件类型处理页面状态变更
     */
    async handleWebhookEvent(event: ConfluenceWebhookEvent): Promise<any> {
        const { page, buttonType, spaceKey, originState, authorName, actions } =
            event;
        let result: any = {};

        try {
            switch (event.eventType) {
                case "page_updated_get_emails":
                    if (actions) {
                        await this.changePageStatus(
                            page.id,
                            actions.changeStatusTo,
                            spaceKey,
                        );
                    }
                    // 获取全部页面标题
                    const { toGroups, ccGroups, pageTitle } =
                        await this.getGroupNameAndStateByButtonType(
                            page.id,
                            buttonType,
                            originState,
                        );
                    // 获取对应群组信息
                    let toEmails = await Promise.all(
                        toGroups.map((groupname) =>
                            this.getGroupEmails(groupname),
                        ),
                    );
                    let ccEmails = await Promise.all(
                        ccGroups.map((groupname) =>
                            this.getGroupEmails(groupname),
                        ),
                    );
                    ccEmails = ccEmails.filter(
                        (email) => !toEmails.includes(email),
                    ); // 过滤掉toEmails上已包含的人员
                    result = {
                        toEmails,
                        ccEmails,
                        authorName,
                        pageTitle,
                        emailTemplate: this.getEmailTemplate(
                            buttonType,
                            originState,
                            pageTitle,
                            page.url,
                        ),
                    };
                    break;
                case "get_all_states":
                    // 如果你想要查看其他的空间状态，可以修改这里的spaceKey
                    const allStates = await this.getAllPageStates(spaceKey);
                    result = { allStates };
                    break;
                case "is_page_changed":
                    const isChanged = await this.getIsPageChanged(page.id);
                    result = { isChanged };
                    break;
                case "change_status_if_page_changed":
                    const isPageChanged = await this.getIsPageChanged(page.id);
                    if (isPageChanged) {
                        await this.changePageStatus(
                            page.id,
                            States_Enum.DRAFT,
                            spaceKey,
                        );
                        result = { statusChanged: true };
                    }
                    break;
                default:
                    result = {
                        message: `Unhandled event type: ${event.eventType}`,
                    };
            }

            return {
                success: true,
                eventType: event.eventType,
                result: result,
            };
        } catch (error) {
            console.error(`Error handling ${event.eventType} event:`, error);
            throw error;
        }
    }
}
