import axios, { AxiosInstance } from 'axios';

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
    buttonType?: 'approve' | 'reject';
    timestamp: number;
}

enum States_ID {
    'draft' = 46563358,
    'pending ITL review' = 46596153,
    'pending BU review' = 46891023,
    'published' = 46891024
}
enum States_Enum {
    DRAFT = 'draft',
    PENDING_ITL_REVIEW = 'pending ITL review',
    PENDING_BU_REVIEW = 'pending BU review',
    PUBLISHED = 'published'
}

interface StatesChangeResult {
    success: boolean;
    newStatus?: States_Enum;
}

type Page_Action = 'approve' | 'reject' | 're-review';

function handleStatusChange(
    currentStatus: States_Enum,
    action: Page_Action
): StatesChangeResult {
    // 根据当前状态 + 操作，匹配新状态
    if (action === 're-review') {
        return {
            success: true,
            newStatus: States_Enum.PENDING_ITL_REVIEW,
        }
    }
    switch (currentStatus) {
        case States_Enum.DRAFT:
            if (action === 'approve') {
                return {
                    success: true,
                    newStatus: States_Enum.PENDING_ITL_REVIEW,
                };
            } else {
                // draft 状态 reject 可根据业务需求调整（示例：保持原状态）
                return {
                    success: false,
                    newStatus: States_Enum.DRAFT,
                };
            }

        case States_Enum.PENDING_ITL_REVIEW:
            if (action === 'approve') {
                // ITL审核通过，进入待BU审核
                return {
                    success: true,
                    newStatus: States_Enum.PENDING_BU_REVIEW,
                };
            } else {
                // ITL审核驳回，退回草稿（可根据业务调整）
                return {
                    success: true,
                    newStatus: States_Enum.DRAFT,
                };
            }

        case States_Enum.PENDING_BU_REVIEW:
            if (action === 'approve') {
                // BU审核通过，发布
                return {
                    success: true,
                    newStatus: States_Enum.PUBLISHED,
                };
            } else {
                // BU审核驳回，退回待ITL审核（核心规则）
                return {
                    success: true,
                    newStatus: States_Enum.PENDING_ITL_REVIEW,
                };
            }

        case States_Enum.PUBLISHED:
            if (action === 'approve') {
                return {
                    success: false,
                };
            } else {
                // draft 状态 reject 可根据业务需求调整（示例：保持原状态）
                return {
                    success: true,
                    newStatus: States_Enum.PENDING_BU_REVIEW,
                };
            }
        // 未定义状态兜底
        default:
            return {
                success: false,
            };
    }
}

export class ConfluenceService {
    private client: AxiosInstance;

    constructor() {
        const baseURL = process.env.CONFLUENCE_BASE_URL;
        const username = process.env.CONFLUENCE_USERNAME;
        const apiToken = process.env.CONFLUENCE_API_TOKEN;

        if (!baseURL || !username || !apiToken) {
            throw new Error('Missing Confluence configuration in environment variables');
        }

        this.client = axios.create({
            baseURL: `${baseURL}/wiki`,
            auth: {
                username: username,
                password: apiToken
            },
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
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
            console.error('Error fetching page:', error);
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
            console.error('Error fetching groups:', error);
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
                    query: condition
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching groups by condition:', error);
            throw error;
        }
    }

    /**
     * 获取对应群组信息
     */
    async getGroupInfo(groupId: string): Promise<any> {
        try {
            const response = await this.client.get(`/rest/api/group/${groupId}/membersByGroupId`);
            return response.data;
        } catch (error) {
            console.error('Error fetching group info:', error);
            throw error;
        }
    }

    /**
     * 获取页面信息 By ID
     */
    async getPageById(pageId: string): Promise<any> {
        try {
            const response = await this.client.get(`/api/v2/pages/${pageId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching page:', error);
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
            console.error('Error fetching all page status IDs:', error);
            throw error;
        }
    }

    /**
     * 获取页面状态
     */
    async getPageStatus(pageId: string): Promise<any> {
        try {
            const state = await this.client.get(`/rest/api/content/${pageId}/state`);
            return state;
        } catch (error) {
            console.error('Error fetching page status:', error);
            throw error;
        }
    }

    /**
     * 获取空间所有页面状态
     */
    async getAllPageStates(spaceKey: string): Promise<any> {
        try {
            const response = await this.client.get(`/rest/api/space/${spaceKey}/state/settings`);
            return response.data;
        } catch (error) {
            console.error('Error fetching all page states:', error);
            throw error;
        }
    }

    /**
     * 修改页面状态
     */
    async changePageStatus(pageId: string, curState: string): Promise<any> {
        try {
            const response = await this.client.put(`/rest/api/content/${pageId}/state?status=current`, {
                id: States_ID[curState],
            });
            return response.data;
        } catch (error) {
            console.error('Error changing page status:', error);
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
                    key: currentPage.space.key
                },
                version: {
                    number: currentPage.version.number + 1
                },
                body: currentPage.body
            };

            const response = await this.client.put(`/content/${pageId}`, updateData);
            return response.data;
        } catch (error) {
            console.error('Error updating page status:', error);
            throw error;
        }
    }

    /**
     * 获取页面的标签
     */
    async getPageLabels(pageId: string): Promise<any> {
        try {
            const response = await this.client.get(`/api/v2/pages/${pageId}/labels`);
            return response.data;
        } catch (error) {
            console.error('Error fetching page labels:', error);
            throw error;
        }
    }

    /**
     * 获取所有父页面拼接的标题
     */

    async getFullPageTitle(pageId: string): Promise<{ groupname: string; states: any, authorId: string | null }> {
        try {
            let titles: string[] = [];
            let currentPageId: string | null = pageId;
            let authorId: string | null = null;
            const states = await this.getPageStatus(pageId);
            while (currentPageId) {
                const page = await this.getPageById(currentPageId);
                if (!authorId) {
                    authorId = page.authorId;
                }
                titles.unshift(page.title);
                currentPageId = page.parentId;
            }
            const wholeTitles = titles.slice(1, titles.length - 1).join('-');
            return { groupname: wholeTitles, states, authorId };
        } catch (error) {
            console.error('Error fetching full page title:', error);
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
            const emails = members.results.map((member: any) => member.email).join(',');
            return emails;
        } catch (error) {
            console.error('Error fetching group emails:', error);
            throw error;
        }
    }

    /**
     * 根据请求类型获取当前需要发送邮件的群组
     */
    async getGroupNameAndStateByButtonType(pageId: string, buttonType?: Page_Action): Promise<{ groupname: string; authorId: string | null, newState?: string }> {
        try {
            // 获取全部页面标题
            let { groupname, states, authorId } = await this.getFullPageTitle(pageId);
            let currentState = states.data.contentState.name;
            if (buttonType) {
                const res = handleStatusChange(currentState as States_Enum, buttonType);
                if (res.success && res.newStatus) {
                    currentState = res.newStatus;
                }
            }
            if (currentState === 'pending ITL review') {
                groupname += '-INTERNAL'
            }
            if (currentState === 'pending BU review') {
                groupname += '-EXTERNAL'
            }
            if (currentState === 'published') {
                groupname = 'END'
            }
            if (authorId && currentState === 'draft') {
                groupname = 'OWNER'
            }
            return { groupname, authorId, newState: currentState };
        } catch (error) {
            console.error('Error fetching group name by button type:', error);
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
                        representation: 'storage'
                    }
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('Error adding footer comment:', error);
            throw error;
        }
    }

    /**
     * 根据事件类型处理页面状态变更
     */
    async handleWebhookEvent(event: ConfluenceWebhookEvent): Promise<any> {
        const { page, group, buttonType } = event;
        let result: any = {};

        try {
            switch (event.eventType) {
                case 'page_updated_get_emails':
                    // 获取全部页面标题
                    const { groupname, newState } = await this.getGroupNameAndStateByButtonType(page.id, buttonType);
                    // 获取对应群组信息
                    if (groupname !== 'OWNER' && groupname !== 'END') {
                        const [emails, _] = await Promise.all([this.getGroupEmails(groupname), this.changePageStatus(page.id, newState)]);
                        result = { emails };
                    }
                    else {
                        await this.changePageStatus(page.id, newState);
                    }
                    break;
                case 'get_all_states':
                    // 如果你想要查看其他的空间状态，可以修改这里的spaceKey
                    const allStates = await this.getAllPageStates('~7120204d2d22dba6d642e69c5987001afaaf19');
                    result = { allStates };
                    break;
                default:
                    result = { message: `Unhandled event type: ${event.eventType}` };
            }

            return {
                success: true,
                eventType: event.eventType,
                result: result
            };

        } catch (error) {
            console.error(`Error handling ${event.eventType} event:`, error);
            throw error;
        }
    }
}
