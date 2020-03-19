<template>
    <div class="contanter">
        <!-- NavBar -->
        <van-nav-bar class="navbar" title="个人信息" left-text="返回" left-arrow @click-left="onClickLeft" />
        <!-- NavBar -->
        <van-cell-group>
            <van-cell title="姓名" :value="info.name" />
            <van-cell title="性别" :value="info.sex ? '男' : '女'" />
            <van-cell title="年龄" :value="info.age" />
            <van-cell title="出生日期" :value="info.birthDate" />
            <van-cell title="地区" :value="info.location" />
        </van-cell-group>
        <van-cell-group style="margin-top:20px;">
            <van-cell title="家庭成员">
                <template slot="default" v-for="item in info.familyMembers"> {{ item }}/ </template>
            </van-cell>
            <van-cell title="被保险人">
                <template slot="default" v-for="item in info.insuredPerson"> {{ item }}/ </template>
            </van-cell>
        </van-cell-group>
        <van-cell-group style="margin-top:20px;">
            <van-cell title="家庭收入" :value="info.yearIncome" />
            <van-cell title="家庭贷款" :value="info.totalLending" />
        </van-cell-group>
        <van-cell-group style="margin-top:20px;" v-for="(item, index) in info.familyMemberList" :key="index" v-if="item.relation == '本人'">
            <van-cell title="病史">
                <template slot="default" v-for="option in item.medicalHistory"> {{ option }}/ </template>
            </van-cell>
            <van-cell title="职业" :value="item.occupation" />
            <van-cell title="社保" :value="item.isSocialSecurity ? '有' : '无'" />
            <van-cell title="经常出差" :value="item.isWorkOut ? '是' : '否'" />
            <van-cell title="经常加班" :value="item.isWorkOvertime ? '是' : '否'" />
            <van-cell title="经常驾车" :value="item.isDrive ? '是' : '否'" />
            <van-cell title="已配置保险" :value="item.isInsure ? '是' : '否'" />
        </van-cell-group>
    </div>
</template>

<script>
import { getCustomerInfo } from '@/api/knowledge'

import io from 'socket.io-client'
import { load } from 'protobufjs'
import Vue from 'vue'
import { Notify } from 'vant'
Vue.use(Notify)
export default {
    name: 'customerInfo',
    data() {
        return {
            customerId: '',
            userId: '',
            info: {}
            // showSheet: false,
        }
    },
    created() {
        this.customerId = this.$route.query.customerId
        this.userId = this.$route.query.userId
        this.customerUserId = this.$route.query.customerUserId
    },
    mounted() {
        this.checkSocket()
        this.getInfo()
    },
    filters: {},
    methods: {
        onClickLeft() {
            this.$router.push({
                path: 'message',
                query: {
                    customerId: this.customerId,
                    userId: this.userId,
                    customerUserId: this.customerUserId
                }
            })
        },
        getInfo() {
            getCustomerInfo(this.customerId)
                .then(res => {
                    console.log('GOOGLE: res', res)
                    this.info = res
                })
                .catch(err => {
                    // console.log(err.response.data.message)
                })
        }
    }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.contanter {
    height: 100vh;
}
</style>
