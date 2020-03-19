/**
 * Created by Administrator on 2017/4/17.
 */
import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

const store = new Vuex.Store({
    state: {
        userList: [],
        socket: {},
        user: {},
        customerImg: "",
        knowText: {},
        status: true //在线状态 登录时为在线
    },
    getters: {
        getTotal: state => state.roomdetail.total,
        getUser: state => state.user,
        getSocket: state => state.socket,
        getCustomerImg: state => state.customerImg,
        getKnowText: state => state.knowText,
        getStatus: state => state.status
    },
    mutations: {
        // 保存用戶頭像
        setCustomerImg(state, value) {
            state.customerImg = value;
        },
        // 登录保存用户信息
        setUser(state, user) {
            state.user = user;
        },
        // 保存socket
        setSocket(state, socket) {
            state.socket = socket;
        },
        //知识库 常用信息->编辑 暂存条目信息
        setText(state, knowText) {
            state.knowText = knowText;
        },
        //在线状态
        setStatus(state, status) {
            state.status = status;
        }
    },
    actions: {
        async uploadAvatar({ commit }, data) {
            const res = await url.postUploadAvatar(data);
            return res.data;
        }
    }
});
export default store;
