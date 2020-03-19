<template>
    <div class="contanter">
        <!-- NavBar -->
        <van-nav-bar title="修改密码" left-text="返回" right-text="完成" left-arrow @click-left="onClickLeft" @click-right="onClickRight" fixed />
        <!-- NavBar -->

        <div class="list">
            <van-cell-group>
                <van-field label="新密码" class="vfd" v-model="pwd1" placeholder="输入新密码" />
                <van-field label="确认密码" class="vfd" v-model="pwd2" placeholder="再次输入" />
                <!-- <van-button class="pwdbtn" type="primary" size="normal" round color="linear-gradient(to right, #06C8FC, #0092FE)" @click="sendpwd">提交修改</van-button> -->
            </van-cell-group>
        </div>
    </div>
</template>

<script>
import io from 'socket.io-client'
import { load } from 'protobufjs'
import Vue from 'vue'
import { Notify } from 'vant'
Vue.use(Notify)
export default {
    name: 'password',
    data() {
        return {
            active: 0, //Tabbar 选中
            pwd1: '',
            pwd2: ''
        }
    },

    mounted() {
        let that = this
        this.checkSocket()

        load('./static/common.proto', function(err, root) {
            if (err) throw err
            let getCustomerListData = root.lookupType('ConsultCustomerList')

            // 获取客户列表
            that.socket.emit('getCustomerList', function(data) {
                that.fedlist = that.decodeData(getCustomerListData, data)
            })
        })
    },
    filters: {},
    methods: {
        onClickLeft() {
            this.$router.push({
                name: 'my'
            })
        },
        onClickRight() {
            this.sendpwd()
        },
        sendpwd() {
            let that = this
            if (this.pwd1 != this.pwd2) {
                Notify({ type: 'warning', message: '输入不一致' })
            } else if (this.pwd1 == '' || this.pwd2 == '') {
                Notify({ type: 'warning', message: '请输入' })
            } else {
                load('./static/common.proto', function(err, root) {
                    if (err) throw err
                    that.common_data = root.lookupType('CommonMessage')
                    that.updatePassData = root.lookupType('UpdatePassword')

                    // 修改密码
                    that.socket.emit('updatePassword', that.encodeData(that.updatePassData, { newPassword: that.pwd2 }), function(data) {
                        console.log('密码 = ', that.decodeData(that.common_data, data))
                        if (that.decodeData(that.common_data, data).message == 'OK') {
                            Notify({ type: 'success', message: '修改成功' })
                        }
                    })
                })
            }
        }
    }
}
</script>

<style scoped>
.contanter {
    height: 100%;
    background-color: #e6e6e6;
}
.list {
    padding: 45px 0px 60px;
    text-align: left;
}
.pwdbtn {
    margin-top: 10px;
    width: 100%;
}
.vfd {
    line-height: 15px;
}
.van-cell-group {
    background: transparent;
}
</style>
