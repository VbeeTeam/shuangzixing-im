import request from "@/utils/request";

// 查询KnowledgeBase type 3文字 4图片 5音频
export function getKnowledge(belong, generalTypeId, page, size, type) {
    return request({
        url: "api/knowledgeBase/show",
        method: "get",
        params: { belong, generalTypeId, page, size, type }
    });
}

// 应用查询通用类型 查询知识库分类下的分类 常用语3 图片4 音频5
export function getClassify(sign) {
    return request({
        url: "api/generalType/show",
        method: "get",
        params: { sign }
    });
}

// 应用-新增KnowledgeBase
export function addKnow(
    belong,
    content,
    creater,
    generalType,
    title,
    type,
    userId
) {
    return request({
        url: "api/knowledgeBase/app",
        method: "post",
        data: { belong, content, creater, generalType, title, type, userId }
    });
}

// 应用-修改KnowledgeBase
export function editKnow(
    belong,
    content,
    creater,
    generalType,
    title,
    type,
    userId,
    id
) {
    return request({
        url: "api/knowledgeBase/app",
        method: "put",
        data: { belong, content, creater, generalType, title, type, userId, id }
    });
}

// 应用-删除KnowledgeBase
export function delKnow(id) {
    return request({
        url: "api/knowledgeBase/app/" + id,
        method: "delete"
    });
}

// 应用-搜索知识库列表
export function KnowledgeBaseSearch(keyword, type, userId) {
    return request({
        url: "api/es/KnowledgeBaseSearch",
        method: "get",
        params: { keyword, type, userId }
    });
}

// 客服系统文件上传接口
const uploadFile = process.env.BASE_API + "api/resources/consultUpload";
export { uploadFile };

// 应用-根据openId查询customerInfo
export function getCustomerInfo(openId) {
    return request({
        url: "api/customer/byOpenId/" + openId,
        method: "get"
    });
}

// 应用-im发送方案
export function getPlan(userId) {
    return request({
        url: "api/planMain/im/" + userId,
        method: "get"
    });
}
