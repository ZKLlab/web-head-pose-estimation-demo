<template>
  <div :style="live2dStyle" class="live2d">
    <div :style="wrapperStyle" class="wrapper">
      <!--suppress HtmlUnknownTarget, HtmlUnknownAttribute -->
      <iframe
        :src="`/live2d.html?m=${m}&t=${t}`"
        :style="iframeStyle"
        ref="iframe"
        sandbox="allow-same-origin allow-scripts"
        seamless
        v-if="!refreshing"
      />
    </div>
    <v-btn @click="refresh" class="refresh-btn" fab v-if="showRefresh" x-small>
      <v-icon>mdi-refresh</v-icon>
    </v-btn>
  </div>
</template>

<script>
  const DEFAULT_TYPE = '1-0';

  export default {
    name: 'Live2D',
    props: {
      type: {
        type: String,
        default: DEFAULT_TYPE,
      },
      width: {
        type: Number,
        default: 400,
      },
      height: {
        type: Number,
        default: 150,
      },
      showRefresh: {
        type: Boolean,
        default: false,
      },
    },
    data() {
      return {
        m: 0,
        t: 0,
        refreshing: false,
        active: true,
      };
    },
    computed: {
      live2dStyle() {
        return {
          width: `${this.width}px`,
          height: `${this.height}px`,
          opacity: this.active ? '1' : '0.5',
        };
      },
      wrapperStyle() {
        return {
          top: `-${(this.width || 0) - (this.height || 0)}px`,
          width: `${this.width}px`,
          height: `${this.width}px`,
        };
      },
      iframeStyle() {
        return {
          transform: `scale(${(this.width || 0) / 400})`,
        };
      },
    },
    watch: {
      type(value) {
        this.parseType(value);
      },
    },
    created() {
      this.parseType(this.type || DEFAULT_TYPE);
    },
    methods: {
      parseType(value) {
        const [m, t] = value.split('-');
        this.m = parseInt(m, 10);
        this.t = parseInt(t, 10);
      },
      setPoint(x, y) {
        if (!this.refreshing && this.$refs.iframe != null) {
          if (this.$refs.iframe.contentWindow.dragMgr) {
            this.$refs.iframe.contentWindow.dragMgr.setPoint(x, y);
          }
        }
      },
      async refresh() {
        this.refreshing = true;
        await this.$nextTick();
        setTimeout(() => {
          this.refreshing = false;
        });
      },
      setActive(value) {
        this.active = value;
      },
    },
  };
</script>

<style scoped>
  .live2d {
    position: relative;
    overflow: visible;
    width: 400px;
    height: 150px;
  }

  .wrapper {
    position: relative;
    overflow: hidden;
    pointer-events: none;
  }

  iframe {
    width: 400px;
    height: 400px;
    transform-origin: left top;
    border: 0;
    background: transparent;
  }

  .refresh-btn {
    position: absolute;
    bottom: 4px;
    left: 4px;
  }
</style>
