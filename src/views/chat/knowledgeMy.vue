<template>
    <div class="contanter">
        <!-- NavBar -->
        <van-nav-bar class="navbar" title="知识库" left-arrow left-text="" @click-left="onClickLeft">
            <van-icon name="plus" slot="right" @click="onClickRight" />
        </van-nav-bar>
        <!-- NavBar -->
        <div class="tab_wrap">
            <!-- tab底部三分类 -->
            <div class="tab">
                <div :class="[tag == 3 ? 'sel' : '', 'tab_item']" @click="tabFun(3)">常用语</div>
                <div :class="[tag == 4 ? 'sel' : '', 'tab_item']" @click="tabFun(4)">图片</div>
                <div :class="[tag == 5 ? 'sel' : '', 'tab_item']" @click="tabFun(5)">音频</div>
            </div>
            <form action="/">
                <van-search class="vsrh" v-model="search_text" placeholder="请输入搜索关键词" show-action shape="round" @search="onSearch">
                    <van-button style="background:#1DA5FE" slot="action" size="small" round type="info" @click.prevent="onSearch">搜索</van-button>
                </van-search>
            </form>
            <div class="tab_content">
                <!-- 常用语显示列表 -->
                <div class="ctn" v-if="tag == 3">
                    <van-tabs v-model="active" @click="onTextClick" color="#1DA5FE" title-active-color="#1DA5FE">
                        <van-tab :name="index" :title="item.text" v-for="(item, index) in textCls" :key="index"> </van-tab>
                    </van-tabs>
                    <div class="list">
                        <!--mescroll滚动区域的基本结构-->
                        <mescroll-vue ref="mescroll" :down="mescrollDown" :up="mescrollUp" @init="mescrollInit">
                            <van-row class="cell" v-for="(item, index) in list" :key="index" @click.stop="showPopup(index)">
                                <van-col class="text" span="18">{{ item.title }}<img class="pimg" src="../../assets/img/public.png" alt=""/></van-col>
                                <!-- <van-col span="6" class="cbtn"> </van-col> -->
                                <van-col span="6" class="cbtn">
                                    <img src="../../assets/img/icon_del@3x.png" alt="" @click.stop="delText(index)" v-if="item.belong != 0" />
                                    <img src="../../assets/img/icon_edit@3x.png" alt="" @click.stop="editText(index)" v-if="item.belong != 0" />
                                </van-col>
                            </van-row>
                        </mescroll-vue>
                    </div>
                </div>
                <!-- 图片 -->
                <div class="ctn" v-if="tag == 4">
                    <van-tabs v-model="active" @click="onImgClick" color="#1DA5FE" title-active-color="#1DA5FE">
                        <van-tab :name="index" :title="item.text" v-for="(item, index) in imgCls" :key="index"> </van-tab>
                    </van-tabs>
                    <!--mescroll滚动区域的基本结构-->
                    <mescroll-vue ref="mescroll" :down="mescrollDown" :up="mescrollUp" @init="mescrollInit">
                        <div class="listimg">
                            <div :class="[imgIdx === index ? 'sel' : '', 'item']" v-for="(item, index) in list" @click="selImg(index)" :key="index">
                                <div class="img">
                                    <van-icon class="delImg" name="delete" @click="deleteImg(index)" v-if="item.belong != 0" />
                                    <img class="fullimg" :src="item.content" />
                                </div>
                            </div>
                        </div>
                    </mescroll-vue>
                </div>
                <img class="empty" src="../../assets/img/empty.png" alt="" v-if="list.length == 0" />
            </div>
        </div>
        <!--  -->

        <van-popup class="pop" v-model="show" position="bottom">
            <div class="popwrap">
                <div class="pccontent">
                    {{ poptext }}
                </div>
                <!-- <div class="pbtn">
                    <img src="../../assets/img/check@2x.png" alt="" @click.capture="closePopup" />
                    <img src="../../assets/img/copy@2x.png" alt="" @click.capture="copyPop(index)" />
                </div> -->
            </div>
        </van-popup>
        <!-- <van-pagination v-model="listQuery.page" :total-items="total" :items-per-page="listQuery.size" @change="handleChange" /> -->
    </div>
</template>

<script>
import io from 'socket.io-client'
import { load } from 'protobufjs'
import { getKnowledge, getClassify, delKnow, KnowledgeBaseSearch } from '@/api/knowledge'
import Vue from 'vue'
import { Notify } from 'vant'
Vue.use(Notify)
import MescrollVue from 'mescroll.js/mescroll.vue'
const base_url = process.env.BASE_API

export default {
    name: 'KnowledgeMy',
    data() {
        return {
            mescroll: null, // mescroll实例对象
            mescrollDown: {
                use: false //关闭向下滑动刷新
            }, //下拉刷新的配置. (如果下拉刷新和上拉加载处理的逻辑是一样的,则mescrollDown可不用写了)
            mescrollUp: {
                // 上拉加载的配置.
                callback: this.getData,
                noMoreSize: 3, //如果列表已无数据,可设置列表的总数量要大于5才显示无更多数据;
                empty: {
                    //列表第一页无任何数据时,显示的空提示布局; 需配置warpId才显示
                    // warpId: "xxid", //父布局的id (1.3.5版本支持传入dom元素)
                    // icon: "./static/mescroll/mescroll-empty.png", //图标,默认null,支持网络图
                    tip: '暂无相关数据~' //提示
                },
                toTop: {
                    src: './static/mescroll/mescroll-totop.png' // 配置回到顶部按钮
                },
                page: {
                    num: 0, // 当前页码,默认0,回调之前会加1,即callback(page)会从1开始
                    size: 15 // 每页数据的数量
                },
                htmlNodata: '<p class="upwarp-nodata">-- 我是有底线的 --</p>',
                auto: true
            },
            title: '', //搜索內容
            search_text: '', //搜索內容
            textCls: [], //常用语下分类
            imgCls: [], //
            voiceCls: [], //
            generalTypeName: '', //分类下的分类 查询
            list: [],
            listQuery: {
                page: 0,
                size: 20
            },

            total: 0,
            show: false,
            poptext: '', //选中的常用语内容
            active: 0, //Tabbar 选中
            // activeNames: ['1'], // 会话列表
            imgIdx: '', // 选中的图片
            tag: 3, // 1文字 2图片 3音频
            isClassify: false //判断是否拉取了小分类
        }
    },

    created() {
        this.checkSocket()
    },
    mounted() {
        // 获取分类的分类
        // for (let i = 3; i < 6; i++) {
        //     getClassify(i)
        //         .then(res => {
        //             switch (i) {
        //                 case 3:
        //                     this.textCls = res
        //                     this.generalTypeName = res[0].id
        //                     break
        //                 case 4:
        //                     this.imgCls = res
        //                     break
        //                 case 5:
        //                     this.voiceCls = res
        //                     break
        //                 default:
        //                     break
        //             }
        //             // 获取generalTypeName后再拉取数据
        //             if (i == 3) {
        //                 // this.getData()
        //             }
        //         })
        //         .catch(err => {
        //             // console.log(err.response.data.message)
        //         })
        // }
    },
    filters: {},
    components: {
        MescrollVue // 注册mescroll组件
    },
    methods: {
        // mescroll组件初始化的回调,可获取到mescroll对象
        mescrollInit(mescroll) {
            this.mescroll = mescroll // 如果this.mescroll对象没有使用到,则mescrollInit可以不用配置
        },
        // 获取小分类
        getClassifyFun() {
            let that = this
            return new Promise((resolve, reject) => {
                for (let i = 3; i < 6; i++) {
                    console.log('GOOGLE: i ', i)
                    getClassify(i)
                        .then(res => {
                            console.log('GOOGLE: res', res)
                            switch (i) {
                                case 3:
                                    that.textCls = res
                                    that.generalTypeName = res[0].id
                                    break
                                case 4:
                                    that.imgCls = res
                                    break
                                case 5:
                                    that.voiceCls = res
                                    break
                                default:
                                    break
                            }
                            // 获取generalTypeName后再拉取数据
                            console.log('GOOGLE: that.generalTypeName', that.generalTypeName)
                            if (i == 3) {
                                that.isClassify = true
                                resolve()
                            }
                        })
                        .catch(err => {
                            reject(err)
                            // console.log(err.response.data.message)
                        })
                }
            })
        },
        async getData(page) {
            console.log('GOOGLE: this.isClassify111', this.isClassify)
            if (!this.isClassify) {
                await this.getClassifyFun()
            }
            console.log('GOOGLE: this.isClassify222', this.isClassify)
            console.log('GOOGLE: this.generalTypeName', this.generalTypeName)
            getKnowledge(this.user.id, this.generalTypeName, page.num - 1, page.size, this.tag)
                .then(res => {
                    console.log('GOOGLE: getData', res)
                    this.list.push(...res.content)
                    // console.log('GOOGLE: this.list', this.list)
                    // this.total = res.totalElements
                    // this.totalPage = Math.ceil(this.total / this.listQuery.size)

                    // if (this.listQuery.page >= this.totalPage) {
                    //     this.finished = true
                    // }
                    // this.listQuery.page++
                    // this.loading = false
                    // 数据渲染成功后,隐藏下拉刷新的状态
                    this.$nextTick(() => {
                        // console.log('GOOGLE: endByPage')
                        this.mescroll.endByPage(res.content, res.totalElements)
                        // console.log('GOOGLE: this.list.length', this.list.length)
                        // console.log('GOOGLE: =page', page.num)
                    })
                })
                .catch(err => {
                    this.mescroll.endErr()
                    // console.log(err.response.data.message)
                })
        },

        onClickLeft() {
            this.$router.push({
                name: 'my'
            })
        },
        onClickRight() {
            switch (this.tag) {
                case 3:
                    this.$router.push({
                        name: 'knowledgeAdd',
                        query: {
                            editStatus: 0
                        }
                    })
                    break
                case 4:
                    this.$router.push({
                        name: 'knowledgeAddImg'
                    })
                    break

                default:
                    break
            }
        },
        showPopup(index) {
            this.show = true
            this.poptext = this.list[index].content
        },
        copy(index) {
            this.poptext = this.list[index].content
            this.$copyText(this.list[index].content)
            Notify({ type: 'success', message: '复制成功' })
        },
        copyPop() {
            this.$copyText(this.poptext)
            this.show = false
            Notify({ type: 'success', message: '复制成功' })
        },

        selImg(index) {
            this.imgIdx = index
        },
        sendImg(index) {
            // if (this.imgIdx != '') {
            let imgData = this.list[this.imgIdx].content
            // console.log('GOOGLE: imgData', imgData)
            this.$emit('sureImg', imgData)
            // }
        },
        // 常用语切换
        onTextClick(name, title) {
            // console.log('GOOGLE: onTextClick')
            this.title = ''
            this.list = []
            this.generalTypeName = this.textCls[name].id
            this.listQuery.page = 0
            // 重置上拉刷新
            this.mescroll.resetUpScroll(false)
            // this.getData()
        },
        // 图片切换
        onImgClick(name, title) {
            // console.log(name, title)
            this.title = ''
            this.list = []
            this.generalTypeName = this.imgCls[name].id
            this.listQuery.page = 0
            // 重置上拉刷新
            this.mescroll.resetUpScroll(false)

            // this.getData()
        },
        // 顶部三按钮切换
        tabFun(index) {
            // 根据index判断底部数据类型 再获取generalTypeName
            switch (index) {
                case 3:
                    if (this.textCls.length > 0) {
                        this.generalTypeName = this.textCls[0].id
                    }
                    break
                case 4:
                    if (this.imgCls.length > 0) {
                        this.generalTypeName = this.imgCls[0].id
                    }
                    break
                case 5:
                    // this.generalTypeName = this.voiceCls[0].id
                    break
            }
            this.title = ''
            this.list = []
            this.listQuery.page = 0
            // 更改查询type 3文字 4图片 5音频
            this.tag = index
            this.active = 0
            // 重置上拉刷新
            this.mescroll.resetUpScroll()

            // this.getData('tabFun')
        },
        closePopup() {
            this.show = false
        },
        editText(index) {
            this.$store.commit('setText', this.list[index])
            this.$router.push({
                name: 'knowledgeAdd',
                query: {
                    editStatus: 1
                }
            })
        },
        delText(index) {
            let id = this.list[index].id
            delKnow(id)
                .then(res => {
                    this.list.splice(index, 1)
                    Notify({ type: 'success', message: '删除成功' })
                })
                .catch(err => {
                    // console.log(err.response.data.message)
                })
        },
        deleteImg(index) {
            let id = this.list[index].id
            delKnow(id)
                .then(res => {
                    this.list.splice(index, 1)
                    Notify({ type: 'success', message: '删除成功' })
                })
                .catch(err => {
                    // console.log(err.response.data.message)
                })
        },
        searchData() {
            KnowledgeBaseSearch(this.search_text, this.tag, this.user.id)
                .then(res => {
                    this.list = res
                })
                .catch(err => {
                    // console.log(err.response.data.message)
                })
        },
        onSearch() {
            // console.log('GOOGLE: onSearch')
            this.listQuery.page = 0
            // this.generalTypeName = ''
            this.searchData()
        }
    }
}
</script>

<style scoped>
.contanter {
    background-color: #e6e6e6;
}
.navbar {
    background: #efefef;
}
.cell {
    display: flex;
    justify-content: space-between;
    box-sizing: border-box;
    padding: 0px 0px;
    margin-bottom: 0px;
    min-height: 44px;
    border-top: 1px solid #ddd;
    background-color: #fff;
    color: #000;
    font-size: 14px;
    line-height: 22px;
}
.cell .text {
    padding-left: 16px;
    text-align: left;
    display: -webkit-box; /*flex弹性布局*/
    -webkit-box-align: center;
    /* -webkit-box-pack: center; */
    /* text-indent: 16px; */
}
.cell .van-col {
    overflow: hidden;
    text-overflow: ellipsis;
    /* white-space: nowrap; */
}
.cell .title {
    color: #000;
}
.cbtn {
    text-align: right;
}
.cbtn img {
    display: block;
    float: right;
    width: 44px;
    /* height: 44px; */
}

.listimg {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
}
.listimg .item {
    /* height: 150px; */
    overflow: hidden;
    margin: 10px 5px;
    width: 30%;
    /* border: 1px solid #fff; */
}
.listimg .item.sel {
    /* border: 1px solid #00ccff; */
}
.listimg .item.sel .radio {
    background: url(~@/assets/img/icon_choice@2x.png) 0 / cover;
}
.listimg .img {
    position: relative;
    width: 100%;
}
.listimg .radio {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 20px;
    height: 20px;
    background: url(~@/assets/img/icon_choice0@2x.png) 0 / cover;
}
.fullimg {
    width: 100%;
}
.sendImg {
    position: absolute;
    top: 8px;
    right: 10px;
    z-index: 100000;
}
.tabImg {
    text-align: right;
}
.tab_wrap {
    /* height: 334px; */
    position: relative;
    padding-top: 4px;
    background: #fff;
    text-align: center;
}
.tab_content {
    background: #fff;
}
.tab_content >>> .van-tabs__wrap {
    display: flex;
}
.tab_content >>> .van-tabs__content {
    /* height: 254px; */
    overflow: auto;
}
.tab {
    bottom: 0;
    display: flex;
    overflow: hidden;
    justify-content: flex-start;
    margin: 0 auto;
    width: 100%;
    width: 90%;
    border-radius: 30px;
    background-color: #efefef;
}
.tab .tab_item {
    flex-grow: 1;
    height: 36px;
    border-radius: 30px;
    background-color: #efefef;
    text-align: center;
    line-height: 36px;
}
.tab .tab_item.sel {
    background-color: #1da5fe;
    color: #fff;
}

.pop {
    padding: 20px 10px;
    min-height: 100px;
    height: 380px;
    border-top: 1px solid #fea03a;
    /* position: relative; */
}
.pccontent {
    flex-grow: 4;
    margin-bottom: 20px;
    padding-right: 60px;
    letter-spacing: 1px;
    line-height: 16px;
}
.pbtn {
    position: fixed;
    right: 20px;
    bottom: 10px;
    flex-grow: 1;
    text-align: right;
}
.pbtn img {
    display: block;
    width: 48px;
    height: 48px;
    cursor: pointer;
}
.popwrap {
    display: flex;
}
.ctn >>> .van-tabs__wrap {
    margin-bottom: 10px;
}
.ctn >>> .van-tabs__wrap::after {
    border: 0;
}

.ctn >>> .van-swipe-cell__right {
    display: flex;
    margin-top: 0;
}
.ctn .edit {
    border: 1px solid #1da5fe;
    background: #1da5fe;
}
.ctn .delete {
    border: 1px solid #ff631d;
    background: #ff631d;
}

.vsrh >>> .van-field__control {
    color: #c0c0c0;
}
.vsrh >>> .van-icon-search {
    color: #c0c0c0;
}
.vsrh >>> .van-field__control {
    line-height: 24px;
}
.delImg {
    position: absolute;
    right: 4px;
    bottom: 4px;
    background: rgba(0, 0, 0, 0.5);
    font-size: 30px;
}
.empty {
    width: 100%;
}
.van-col--12 {
    text-align: left;
}
.pimg {
    width: 33px;
    height: 14px;
    margin-left: 6px;
    vertical-align: middle;
}
/*通过fixed固定mescroll的高度*/
.mescroll {
    position: fixed;
    top: 190px;
    bottom: 0;
    height: auto;
}
.mescroll >>> .mescroll-upwarp {
    /* border-top: 1px solid #ddd; */
}
</style>
