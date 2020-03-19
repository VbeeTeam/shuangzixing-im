// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from "vue";
import App from "./App";
import router from "./router";
import "./assets/css/chat.css";
import store from "./store";
import "./assets/font_icon/iconfont.css";
//复制到粘贴板插件
import VueClipboard from "vue-clipboard2";
VueClipboard.config.autoSetContainer = true;
Vue.use(VueClipboard);
// import ElementUI from "element-ui";
// import "element-ui/lib/theme-chalk/index.css";
import Vant from "vant";
import "vant/lib/index.css";
// Vue.use(ElementUI);
Vue.use(Vant);

Vue.config.productionTip = false;

// 全局注册混合对象 注入常用处理方法
Vue.mixin({
    data: function() {
        return {
            socket: {},
            user: {}
        };
    },
    mounted: function() {},
    methods: {
        decodeData(protoBufType, data) {
            var d = new Uint8Array(data.byteLength);
            var dataView = new DataView(data);
            for (var i = 0; i < data.byteLength; i++) {
                d[i] = dataView.getInt8(i);
            }
            // console.log(d)
            return protoBufType.decode(d);
        },
        encodeData(protoBufType, data) {
            let message = protoBufType.create(data);
            let buffer = protoBufType.encode(message).finish();
            var bufArr = new ArrayBuffer(buffer.length);
            var bufView = new Uint8Array(bufArr);
            bufView.set(buffer);
            return bufArr;
        },
        // 判断登录状态
        checkSocket() {
            let socket = this.$store.getters.getSocket;
            let user = this.$store.getters.getUser;
            // console.log("GOOGLE: user", user);
            if (socket == null || Object.keys(socket).length === 0) {
                //如果为空 跳转
                console.log("登录失效");
                this.$router.push({
                    name: "login"
                });
            } else {
                //不为空 进行赋值
                this.socket = socket;
                this.user = user;
            }
        }
    }
});

/* eslint-disable no-new */
new Vue({
    el: "#app",
    router,
    store,
    template: "<App/>",
    components: { App }
});
