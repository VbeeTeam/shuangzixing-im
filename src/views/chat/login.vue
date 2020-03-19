<template>
    <div class="login">
        <van-cell-group class="login-form">
            <div class="title">
                <img src="../../assets/img/IMlogo.png" alt="" class="fullimg" />
            </div>
            <div class="iptwrap">
                <div class="input">
                    <i class="icon iconfont icon-user"></i>
                    <van-field class="bfield" left-icon="icon-User" v-model="loginForm.username" placeholder="请输入用户名" />
                </div>
                <div class="input">
                    <i class="icon iconfont icon-lock"></i>
                    <van-field class="bfield" left-icon="icon-lock" v-model="loginForm.password" type="password" placeholder="请输入密码" />
                </div>
                <van-checkbox class="checkbox" v-model="checked">记住我</van-checkbox>
                <van-button class="lgnbtn" size="small" round color="linear-gradient(to right, #06C8FC, #0092FE)" @click.native.prevent="handleLogin">登录</van-button>
            </div>
        </van-cell-group>
    </div>
</template>
<script>
const base_socket = process.env.BASE_SOCKET

import io from 'socket.io-client'
import { load } from 'protobufjs'
import Vue from 'vue'
import { Notify } from 'vant'
Vue.use(Notify)
export default {
    name: 'Login',
    data() {
        return {
            checked: true, //记住登录状态
            socket: null,
            loginForm: {
                username: '', //guwen1
                password: '' //123456
            },
            loginRules: {
                username: [
                    {
                        required: true,
                        trigger: 'blur',
                        message: '用户名不能为空'
                    }
                ],
                password: [{ required: true, trigger: 'blur', message: '密码不能为空' }]
            },
            loading: false,
            redirect: undefined,
            userInfo_data: {}, //proto
            RepeatLogin: {} //proto
        }
    },
    watch: {
        $route: {
            handler: function(route) {
                this.redirect = route.query && route.query.redirect
            },
            immediate: true
        }
    },
    created() {},
    mounted() {
        let name = localStorage.getItem('loginName')
        let password = localStorage.getItem('loginPassword')
        if (name && password) {
            this.loginForm.username = name
            this.loginForm.password = password
        }
    },
    methods: {
        getCookie() {},
        handleLogin() {
            if (this.loginForm.username && this.loginForm.password) {
                let that = this
                let req = `${base_socket}?userId=${this.loginForm.username}&password=${this.loginForm.password}`
                this.socket = io(req)
                // 链接失败后 关闭连接 防止重连
                this.socket.on('connect_error', error => {
                    this.socket.close()
                    this.socket.disconnect()
                    console.log('GOOGLE: 关闭连接 防止重连')
                    Notify({ type: 'danger', message: '登录失败' })
                    return
                })
                // 在使用getUserInfo时，如果不传回调则可以使用监听的方式接收数据

                load('./static/common.proto', function(err, root) {
                    if (err) throw err
                    that.userInfo_data = root.lookupType('ConsultUserInfo')
                    that.RepeatLogin = root.lookupType('RepeatLogin')
                    // let message_data = root.lookupType('ConsultMessage')

                    // 判断重复登录
                    that.socket.on('repeatLogin', function(data) {
                        let msg = that.decodeData(that.RepeatLogin, data)
                        console.log('GOOGLE: handleLogin -> msg', msg)
                        if (msg.repeatLoginStatus == true) {
                            Notify({ type: 'success', message: '已有用户登录' })
                            return
                        }
                    })
                    // 获取当前登录的顾问账户信息
                    that.socket.emit('getUserInfo', function(data) {
                        let user = that.decodeData(that.userInfo_data, data)
                        that.$store.commit('setUser', user)
                        that.$store.commit('setSocket', that.socket)

                        if (that.checked == true) {
                            localStorage.setItem('loginName', that.loginForm.username)
                            localStorage.setItem('loginPassword', that.loginForm.password)
                        } else {
                            localStorage.removeItem('loginName')
                            localStorage.removeItem('loginPassword')
                        }
                        Notify({ type: 'success', message: '登录成功' })
                        that.$router.push({
                            name: 'list'
                        })
                    })
                })
            } else {
                Notify({ type: 'danger', message: '请输入用户名和密码' })
            }
        },

        cux() {
            this.$router.push({
                name: 'list'
            })
        }
    }
}
</script>

<style scoped>
.login {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    height: 100%;
    background-image: url(~@/assets/img/bg_login.png);
    background-size: cover;
}
.title {
    margin: 90px auto 60px auto;
    width: 108px;
    color: #707070;
    text-align: center;
}

.login-form {
    box-sizing: border-box;
    padding: 25px 25px 15px 25px;
    width: 100%;
    height: 100%;
    border-radius: 6px;
    background: transparent;
    text-align: center;
}
.lgnbtn {
    margin-top: 20px;
    min-width: 300px;
    /* border-radius: 30px; */
    width: 300px;
    height: 48px;
    box-shadow: 0px 5px 10px rgba(2, 210, 251, 0.5);
    text-align: center;
    font-size: 18px;
    line-height: 48px;

    /* letter-spacing: 8px; */
    /* text-align: center; */
}
.bfield {
    margin-bottom: 30px;
    width: 300px;
    height: 48px;
    border-radius: 20px;
    box-shadow: 5px 5px 5px #d9d9d9;
    /* line-height: 48px; */
}
.bfield >>> .van-field__control {
    height: 28px;
}
.bfield >>> .van-field__left-icon {
    color: #1da5fe;
}
.bfield >>> .van-field__left-icon .van-icon {
    font-weight: bold;
    font-size: 22px;
}
.bfield >>> .van-cell__value .van-field__control {
    color: #000;
    text-indent: 12px;
    line-height: 20px;
}
.iptwrap {
    right: 0;
    left: 0;
    /* display: flex; */
    /* flex-direction: column; */
    margin: auto;
    width: 300px;
}
.input {
    position: relative;
    width: 300px;
}
.input .iconfont {
    position: absolute;
    top: 12px;
    left: 20px;
    z-index: 10;
    color: #1da5fe;
    font-size: 26px;
}
.checkbox {
    float: right;
}
</style>
