<template>
    <div class="contanter">
        <!-- NavBar -->
        <van-nav-bar class="navbar" :title="navText" left-arrow left-text="" @click-left="onClickLeft" />
        <!-- NavBar -->
        <p class="text">标题（不超过80个字）</p>
        <van-cell-group>
            <van-field v-model="title" rows="1" autosize type="textarea" maxlength="80" placeholder="请输入留言" show-word-limit />
        </van-cell-group>
        <p class="text text2">正文（不超过300个字）</p>
        <van-cell-group>
            <van-field v-model="content" rows="6" autosize type="textarea" maxlength="300" placeholder="请输入留言" show-word-limit />
        </van-cell-group>
        <van-cell-group>
            <van-radio-group class="rdg" v-model="generalTypeID">
                <van-radio class="rdo" :name="item.id" v-for="(item, index) in textCls" :key="index">{{ item.text }}</van-radio>
            </van-radio-group>
        </van-cell-group>

        <div class="btn">
            <van-button class="send" size="small" round color="linear-gradient(to right, #06C8FC, #0092FE)" @click.native.prevent="save">提交</van-button>
        </div>

        <!-- <van-pagination v-model="listQuery.page" :total-items="total" :items-per-page="listQuery.size" @change="handleChange" /> -->
    </div>
</template>

<script>
import io from 'socket.io-client'
import { load } from 'protobufjs'
import { addKnow, editKnow, getClassify } from '@/api/knowledge'
import Vue from 'vue'
import { Notify } from 'vant'
Vue.use(Notify)

const base_url = process.env.BASE_API

export default {
    name: 'Knowledge',
    data() {
        return {
            navText: '添加',
            user: '',
            title: '',
            content: '',
            textCls: [], //图片分类
            generalTypeID: '',
            editInfo: {},
            editStatus: 0,
            id: '', //編輯文章id
            belong: 2, //固定传2
            type: 3 //编辑常用语 固定传3
        }
    },

    created() {
        this.checkSocket()
        this.editStatus = this.$route.query.editStatus
        // 获取分类的分类
        getClassify(3)
            .then(res => {
                this.textCls = res
            })
            .catch(err => {
                // console.log(err.response.data.message)
            })
        if (this.editStatus == 1) {
            let info = this.$store.getters.getKnowText
            this.id = info.id
            this.title = info.title
            this.content = info.content
            this.generalTypeID = info.generalType.id
            this.belong = info.belong
            this.navText = '编辑'
        }
    },
    mounted() {
        this.user = this.$store.getters.getUser
    },
    filters: {},
    methods: {
        save() {
            // 1 为编辑状态 0为添加
            if (this.editStatus == 1) {
                // 编辑提交
                if (this.content && this.title && this.generalTypeID) {
                    let generalType = {
                        id: this.generalTypeID
                    }
                    editKnow(this.belong, this.content, this.user.userName, generalType, this.title, this.type, this.user.id, this.id)
                        .then(res => {
                            Notify({ type: 'success', message: '编辑成功' })

                            // this.list = res.content
                            // this.total = res.totalElements
                        })
                        .catch(err => {
                            // console.log(err.response.data.message)
                        })
                } else {
                    Notify({ type: 'danger', message: '请完整填入信息' })
                }
            } else {
                // 添加提交
                if (this.content && this.title && this.generalTypeID) {
                    let generalType = {
                        id: this.generalTypeID
                    }
                    addKnow(this.belong, this.content, this.user.userName, generalType, this.title, this.type, this.user.id)
                        .then(res => {
                            Notify({ type: 'success', message: '添加成功' })
                            this.editStatus = 1
                            this.navText = '编辑'
                            this.id = res.id
                            this.belong = res.belong
                        })
                        .catch(err => {
                            // console.log(err.response.data.message)
                        })
                } else {
                    Notify({ type: 'danger', message: '请完整填入信息' })
                }
            }
        },
        onClickLeft() {
            this.$router.push({
                name: 'knowledgeMy'
            })
        }
    }
}
</script>

<style scoped>
.contanter {
    height: 100%;
    background-color: #e6e6e6;
}
.navbar {
    background: #efefef;
}
.text {
    margin-top: 20px;
    margin-bottom: 8px;
    text-indent: 16px;
}
.text2 {
    margin-top: 40px;
}
.send {
    margin: 40px auto 40px;
    width: 300px;
}
.btn {
    width: 100%;
    text-align: center;
}
.rdg {
    display: flex;
    margin-top: 20px;
    padding: 10px;
}
.rdo {
    margin-right: 10px;
}
</style>
