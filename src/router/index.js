import Vue from "vue";
import Router from "vue-router";
import login from "@/views/chat/login";
import list from "@/views/chat/friendList";
import listClosed from "@/views/chat/friendListClosed";
import message from "@/views/chat/message";
import my from "@/views/chat/my";
import password from "@/views/chat/password";
import edge from "@/views/chat/knowledge";
import knowledgeMy from "@/views/chat/knowledgeMy";
import knowledgeAdd from "@/views/chat/knowledgeAdd";
import knowledgeAddImg from "@/views/chat/knowledgeAddImg";
import customerInfo from "@/views/chat/customerInfo";

Vue.use(Router);

export default new Router({
    // mode: "history",
    routes: [
        {
            path: "/",
            name: "login",
            component: login
        },
        {
            path: "/list",
            name: "list",
            component: list
        },
        {
            path: "/listClosed",
            name: "listClosed",
            component: listClosed
        },
        {
            path: "/message",
            name: "message",
            component: message
        },
        {
            path: "/my",
            name: "my",
            component: my
        },
        {
            path: "/password",
            name: "password",
            component: password
        },
        {
            path: "/edge",
            name: "edge",
            component: edge
        },
        {
            path: "/knowledgeMy",
            name: "knowledgeMy",
            component: knowledgeMy
        },
        {
            path: "/knowledgeAdd",
            name: "knowledgeAdd",
            component: knowledgeAdd
        },
        {
            path: "/knowledgeAddImg",
            name: "knowledgeAddImg",
            component: knowledgeAddImg
        },
        {
            path: "/customerInfo",
            name: "customerInfo",
            component: customerInfo
        }
    ]
});
