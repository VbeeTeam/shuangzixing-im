<template>
    <div class="contanter">
        <!-- NavBar -->
        <van-nav-bar class="navbar" title="知识库" left-text="" @click-left="onClickLeft" />
        <!-- NavBar -->
        <div class="tab_wrap">
            <!-- tab底部三分类 -->
            <div class="tab">
                <div :class="[tag == 3 ? 'sel' : '', 'tab_item']" @click="tabFun(3)">常用语</div>
                <div :class="[tag == 4 ? 'sel' : '', 'tab_item']" @click="tabFun(4)">图片</div>
                <div :class="[tag == 5 ? 'sel' : '', 'tab_item']" @click="tabFun(5)">音频</div>
            </div>
            <div class="tab_content">
                <!-- 常用语显示列表 -->
                <div class="ctn" v-if="tag == 3">
                    <van-tabs v-model="active" @click="onTextClick" color="#1DA5FE" title-active-color="#1DA5FE">
                        <van-tab :name="index" :title="item.text" v-for="(item, index) in textCls" :key="index"> </van-tab>
                        <img class="empty" src="../../assets/img/empty.png" alt="" v-if="list.length == 0" />
                    </van-tabs>
                    <!--mescroll滚动区域的基本结构-->

                    <mescroll-vue ref="mescroll" :down="mescrollDown" :up="mescrollUp" @init="mescrollInit">
                        <div class="list">
                            <van-row class="cell" v-for="(item, index) in list" @click="showPopup(index)" :key="index">
                                <van-col class="text" span="18">{{ item.title }}</van-col>
                                <van-col span="6" class="cbtn">
                                    <img src="../../assets/img/check-2@2x.png" alt="" />
                                    <img src="../../assets/img/copy-2@2x.png" alt="" @click.stop="copy(index)" />
                                </van-col>
                            </van-row>
                        </div>
                    </mescroll-vue>
                </div>
                <!-- 图片 -->
                <div class="ctn" v-if="tag == 4">
                    <van-tabs v-model="active" @click="onImgClick" color="#1DA5FE" title-active-color="#1DA5FE">
                        <van-tab :name="index" :title="item.text" v-for="(item, index) in imgCls" :key="index">
                            <van-button class="sendImg" type="primary" size="small" round color="linear-gradient(to right, #06C8FC, #0092FE)" @click.stop="sendImg()">发送</van-button>
                        </van-tab>
                        <img class="empty" src="../../assets/img/empty.png" alt="" v-if="list.length == 0" />
                    </van-tabs>
                    <!--mescroll滚动区域的基本结构-->
                    <mescroll-vue ref="mescroll" :down="mescrollDown" :up="mescrollUp" @init="mescrollInit">
                        <div class="listimg">
                            <div :class="[imgIdx === index ? 'sel' : '', 'item']" v-for="(item, index) in list" @click="selImg(index)" :key="index">
                                <div class="img">
                                    <img class="fullimg" :src="item.content" />
                                    <div class="radio"></div>
                                </div>
                            </div>
                        </div>
                    </mescroll-vue>
                </div>
            </div>
        </div>
        <!--  -->

        <van-popup class="pop" v-model="show" position="bottom">
            <div class="popwrap">
                <div class="pccontent">
                    {{ poptext }}
                </div>
                <div class="pbtn">
                    <img src="../../assets/img/check@2x.png" alt="" @click.capture="closePopup" />
                    <img src="../../assets/img/copy@2x.png" alt="" @click.capture="copyPop(index)" />
                </div>
            </div>
        </van-popup>
    </div>
</template>

<script>
import io from 'socket.io-client'
import { load } from 'protobufjs'
import { getKnowledge, getClassify } from '@/api/knowledge'
import Vue from 'vue'
import { Notify } from 'vant'
Vue.use(Notify)
import MescrollVue from 'mescroll.js/mescroll.vue'

const base_url = process.env.BASE_API

export default {
    name: 'Knowledge',
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
            textCls: [], //常用语下分类
            imgCls: [], //
            voiceCls: [], //
            generalTypeName: '', //分类下的分类 查询
            list: [],
            listQuery: {
                page: 0,
                size: 10
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
    components: {
        MescrollVue // 注册mescroll组件
    },
    created() {
        this.checkSocket()
    },
    mounted() {},
    filters: {},
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
                    getClassify(i)
                        .then(res => {
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
                            if (i == 3) {
                                // this.getData()
                            }
                            that.isClassify = true
                            resolve()
                        })
                        .catch(err => {
                            reject(err)
                            // console.log(err.response.data.message)
                        })
                }
            })
        },
        async getData(page) {
            if (!this.isClassify) {
                await this.getClassifyFun()
            }
            console.log('GOOGLE: page', page)
            getKnowledge(this.user.id, this.generalTypeName, page.num - 1, page.size, this.tag)
                .then(res => {
                    console.log('GOOGLE: getData', res)
                    this.list.push(...res.content)
                    // 数据渲染成功后,隐藏下拉刷新的状态
                    this.$nextTick(() => {
                        console.log('GOOGLE: endByPage')
                        this.mescroll.endByPage(res.content, res.totalElements)
                    })
                })
                .catch(err => {
                    this.mescroll.endErr()
                    // console.log(err.response.data.message)
                })
        },

        toMessage(id) {
            this.$router.push({
                name: 'message',
                query: {
                    id: id
                }
            })
        },
        onClickLeft() {
            // this.show = false
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

        onClick(name) {
            this.listQuery.page = 0
            this.tag = name
            this.getData()
        },
        selImg(index) {
            this.imgIdx = index
        },
        sendImg(index) {
            // if (this.imgIdx != '') {
            let imgData = this.list[this.imgIdx].content
            this.$emit('sureImg', imgData)
            // }
        },
        // 常用语切换
        onTextClick(name, title) {
            this.generalTypeName = this.textCls[name].id
            this.listQuery.page = 0
            this.list = []
            // 重置上拉刷新
            this.mescroll.resetUpScroll(false)
            // this.getData()
        },
        // 图片切换
        onImgClick(name, title) {
            this.generalTypeName = this.imgCls[name].id
            this.listQuery.page = 0
            this.list = []
            // 重置上拉刷新
            this.mescroll.resetUpScroll(false)
            // this.getData()
        },
        // 底部三按钮切换
        tabFun(index) {
            // 根据index判断底部数据类型 再获取generalTypeName
            switch (index) {
                case 3:
                    this.generalTypeName = this.textCls[0].id
                    break
                case 4:
                    this.generalTypeName = this.imgCls[0].id
                    break
                case 5:
                    this.list = []
                    // this.generalTypeName = this.voiceCls[0].id
                    break
            }
            this.listQuery.page = 0
            // 更改查询type 1文字 2图片 3音频
            this.tag = index
            this.active = 0
            this.list = []
            // 重置上拉刷新
            this.mescroll.resetUpScroll(false)
            // this.getData()
        },
        closePopup() {
            this.show = false
        }
    }
}
</script>

<style scoped>
.contanter {
    height: 480px;
    background-color: #e6e6e6;
}
.navbar {
    background: #efefef;
}
.cell {
    display: flex;
    justify-content: space-between;
    box-sizing: border-box;
    /* padding: 3px 10px; */
    margin-bottom: 1px;
    height: 44px;
    border-top: 1px solid #ddd;
    background-color: #fff;
    color: #000;
    font-size: 14px;
    line-height: 44px;
}
.cell .text {
    text-indent: 16px;
}
.cell .van-col {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.cell .title {
    color: #000;
}
.cbtn {
    text-align: right;
}
.cbtn img {
    width: 44px;
    height: 44px;
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
    position: relative;
    height: 434px;
}
.tab_content {
    background: #fff;
}
.tab_content >>> .van-tabs__wrap {
    display: flex;
}
.tab_content >>> .van-tabs__content {
    overflow: auto;
    height: 354px;
}
.tab {
    position: absolute;
    bottom: 0;
    display: flex;
    justify-content: flex-start;
    width: 100%;
}
.tab .tab_item {
    flex-grow: 1;
    height: 36px;
    background-color: #efefef;
    text-align: center;
    line-height: 36px;
}
.tab .tab_item.sel {
    background-color: #babec1;
    color: #fff;
}

.pop {
    padding: 20px 10px;
    min-height: 100px;
    height: 480px;
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
.empty {
    width: 100%;
    /* height: 100%; */
}
.ctn {
    position: relative;
}
/*通过fixed固定mescroll的高度*/
.mescroll {
    position: absolute;
    top: 44px;
    bottom: 0;
    height: 355px;
}
</style>
