<template>
    <div class="contanter">
        <!-- NavBar -->
        <van-nav-bar class="navbar" :title="navText" left-arrow left-text="" @click-left="onClickLeft" />
        <!-- NavBar -->
        <p class="text">给图片增加标题（不超过80个字）</p>
        <van-cell-group>
            <van-field v-model="title" rows="1" autosize type="textarea" maxlength="80" placeholder="请输入标题" show-word-limit />
        </van-cell-group>
        <p class="text"></p>
        <van-cell-group style="text-align:center">
            <van-uploader v-model="fileList" :accept="'image/*'" :after-read="onRead" @delete="delImg" :max-count="1" />
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
import { addKnow, getClassify } from '@/api/knowledge'
import { uploadFile } from '@/api/knowledge'
import axios from 'axios'

import Vue from 'vue'
import { Notify } from 'vant'
Vue.use(Notify)

const base_url = process.env.BASE_API

export default {
    name: 'Knowledge',
    data() {
        return {
            navText: '添加',
            imgUrl: '',
            fileList: [],
            user: '',
            title: '',
            content: '',
            textCls: [], //图片分类
            generalTypeID: '',
            editInfo: {},
            editStatus: 0,
            id: '', //編輯文章id
            belong: 2, //固定传2
            type: 4 //编辑图片 固定传4
        }
    },

    created() {
        this.checkSocket()
        // this.editStatus = this.$route.query.editStatus
        // 获取分类的分类
        getClassify(4)
            .then(res => {
                this.textCls = res
            })
            .catch(err => {
                // console.log(err.response.data.message)
            })
    },
    mounted() {
        this.user = this.$store.getters.getUser
    },
    filters: {},
    methods: {
        // 上传图片
        onRead(file) {
            // console.log('GOOGLE: file', file)
            // 上传图片到图片服务器
            // let url = 'http://192.168.199.30:8000/api/resources/consultUpload'
            let url = base_url + uploadFile
            let fd = new FormData()
            fd.append('file', file.file)
            axios
                .post(url, fd, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                })
                .then(res => {
                    this.imgUrl = res.data.data
                    this.fileList = []
                    this.fileList.push({
                        url: this.imgUrl
                    })
                    // this.pushImg(res.data.data)
                })
                .catch(err => {
                    alert(err)
                })
        },
        save() {
            // 添加提交
            if (this.imgUrl && this.title && this.generalTypeID) {
                let generalType = {
                    id: this.generalTypeID
                }
                addKnow(this.belong, this.imgUrl, this.user.userName, generalType, this.title, this.type, this.user.id)
                    .then(res => {
                        Notify({ type: 'success', message: '添加成功' })

                        // this.fileList = []
                        // this.title = ''
                        // this.imgUrl = ''
                        // this.generalTypeID = ''
                    })
                    .catch(err => {
                        // console.log(err.response.data.message)
                    })
            } else {
                Notify({ type: 'danger', message: '请完整填入信息' })
            }
        },
        onClickLeft() {
            this.$router.push({
                name: 'knowledgeMy'
            })
        },
        delImg() {
            this.imgUrl = ''
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
