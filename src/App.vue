<template>
    <div id="app">
        <!-- <transition :name="transitionName"> -->
        <router-view class="child-view"></router-view>
        <!-- </transition>  -->
    </div>
</template>

<script>
export default {
    name: 'app',
    data() {
        return {
            transitionName: ''
        }
    },
    watch: {
        $route(to, from) {
            const toDepth = to.path.split('/').length
            const fromDepth = from.path.split('/').length
            this.transitionName = toDepth < fromDepth ? 'slide-right' : 'slide-left'
        }
    }
}
window.onload = function() {
    document.addEventListener('touchstart', function(event) {
        if (event.touches.length > 1) {
            event.preventDefault()
        }
    })
    document.addEventListener('gesturestart', function(event) {
        event.preventDefault()
    })
}
</script>

<style>
@import './assets/css/master.css';

/*#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}*/

body {
    width: 100%;
    height: 100%;
    background: #f7f7f7;
    /*text-align: center;*/
}
#app {
    overflow: hidden;
    width: 100vw;
    height: 100vh;
}
/*页面切换效果*/
.child-view {
    position: absolute;
    width: 100%;
    transition: all 0.8s cubic-bezier(0.55, 0, 0.1, 0.8);
}

.slide-left-enter,
.slide-right-leave-active {
    opacity: 0;
    -webkit-transform: translate(50px, 0);
    transform: translate(50px, 0);
}

.slide-left-leave-active,
.slide-right-enter {
    opacity: 0;
    -webkit-transform: translate(-50px, 0);
    transform: translate(-50px, 0);
}
/* notify */
.van-notify {
    top: 56px !important;
    right: 0 !important;
    left: 0 !important;
    margin: auto !important;
    width: 80% !important;
    border-radius: 30px;
    background: url(~@/assets/img/icon_notify@3x.png) no-repeat 10px 8px / 16px;
    background-color: #fff !important;
    box-shadow: 3px 3px 10px #d9d9d9;
    color: #fea03a !important;
    text-align: left !important;
    text-indent: 18px !important;
    /* border: 1px solid #000; */
}
</style>
