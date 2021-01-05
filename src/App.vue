<template>
  <v-app>
    <v-bottom-navigation app v-model="navValue" value="null">
      <v-dialog max-width="640" v-model="videoDialogVisible">
        <template v-slot:activator="{ on }">
          <v-btn :loading="modelLoading || videoBusy" @click="startVideo" v-on="on" value="video">
            <template>开启视频</template>
            <v-icon>mdi-video</v-icon>
          </v-btn>
        </template>
        <v-card>
          <v-card-title class="subtitle-1">
            <v-icon class="mr-2">mdi-help-circle-outline</v-icon>
            今天你想用什么形象呢？
          </v-card-title>
          <v-card-text class="pb-6">
            <v-row align="end">
              <v-col :cols="5">
                <v-responsive :aspect-ratio="16 / 9">
                  <canvas
                    class="self-video self-video-overlap"
                    height="180"
                    ref="selfVideoOverlay"
                    v-show="videoStream != null"
                    width="320"
                  />
                  <video
                    autoplay
                    class="self-video"
                    muted
                    playsinline
                    ref="selfVideo"
                    v-show="videoStream != null"
                  />
                  <v-row
                    align="center"
                    class="fill-height grey darken-3"
                    justify="center"
                    v-if="videoStream == null"
                  >
                    <v-icon color="grey darken-2">mdi-video-off-outline</v-icon>
                  </v-row>
                </v-responsive>
              </v-col>
              <v-col :cols="6">
                <Live2D
                  :height="150"
                  :type="selfLive2DType"
                  :width="300"
                  ref="previewLive2D"
                  show-refresh
                  v-if="videoDialogVisible && selfLive2DType != null" />
              </v-col>
              <v-col :cols="1">
                <v-row dense>
                  <v-col :cols="12">
                    <v-btn @click="changeCharacter" class="float-right" fab x-small>
                      <v-icon>mdi-account-convert</v-icon>
                    </v-btn>
                  </v-col>
                  <v-col :cols="12">
                    <v-btn @click="changeTexture" class="float-right" fab x-small>
                      <v-icon>mdi-tshirt-crew-outline</v-icon>
                    </v-btn>
                  </v-col>
                  <v-col :cols="12">
                    <v-btn @click="showMoreSettings = !showMoreSettings" class="float-right" fab x-small>
                      <v-icon>mdi-settings-outline</v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
            <v-expand-transition>
              <v-row align="center" class="pt-3" v-if="showMoreSettings">
                <v-col :cols="2">
                  水平灵敏度
                </v-col>
                <v-col :cols="4">
                  <v-slider :max="3.5" :min="0.5" :step="0.5" hide-details thumb-label ticks v-model="vSensitive" />
                </v-col>
                <v-col :cols="2">
                  垂直灵敏度
                </v-col>
                <v-col :cols="4">
                  <v-slider :max="3.5" :min="0.5" :step="0.5" hide-details thumb-label ticks v-model="hSensitive" />
                </v-col>
              </v-row>
            </v-expand-transition>
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-bottom-navigation>
  </v-app>
</template>

<script>
  import * as faceapi from 'face-api.js';
  import Live2D from './components/Live2D';
  import { estimatePose } from './utils/head-pose';
  import { getNextCharacter, getNextTexture } from './utils/live2d-api';


  export default {
    name: 'App',
    components: { Live2D },
    data() {
      return {
        modelLoading: true,
        navValue: 'null',
        videoBusy: false,
        videoStream: null,
        videoDialogVisible: false,
        selfLive2DType: null,
        showMoreSettings: false,
        hSensitive: 2,
        vSensitive: 2,
      };
    },
    watch: {
      navValue(value) {
        if (value !== 'null') {
          this.$nextTick(() => {
            setTimeout(() => {
              this.navValue = 'null';
            });
          });
        }
      },
      videoDialogVisible(value) {
        if (!value) {
          this.stopVideo();
        }
      },
    },
    async mounted() {
      await Promise.all([
        faceapi.loadTinyFaceDetectorModel('./models'),
        faceapi.loadFaceLandmarkTinyModel('./models'),
      ]);
      this.modelLoading = false;
      await this.changeCharacter();
    },
    beforeDestroy() {
      this.stopVideo();
    },
    methods: {
      async startVideo() {
        if (!this.videoBusy && this.videoStream == null) {
          this.videoBusy = true;
          try {
            this.videoStream = await navigator.mediaDevices.getUserMedia({
              video: {
                noiseSuppression: { ideal: true },
                width: { ideal: 320 },
                height: { ideal: 180 },
              },
              audio: false,
            });
            if (!this.videoDialogVisible) {
              this.stopVideo();
            } else {
              this.videoStream.addEventListener('inactive', this.stopVideo);
              this.$refs.selfVideo.srcObject = this.videoStream;
              this.$refs.selfVideo.addEventListener('playing', () => this.faceDetect(true), {
                once: true,
              });
            }
          } catch (e) {
            // eslint-disable-next-line
            console.error(`Error: ${e}`);
          }
          this.videoBusy = false;
        }
      },
      stopVideo() {
        if (this.videoStream != null) {
          this.videoStream.getTracks().forEach((track) => track.stop());
          this.$refs.selfVideo.srcObject = null;
          this.videoStream = null;
        }
      },
      async faceDetect() {
        if (this.videoStream != null) {
          const result = await faceapi
            .detectSingleFace(this.$refs.selfVideo, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks(true);
          if (result != null) {
            const { pitch, yaw } = await estimatePose(result.landmarks.positions, result.detection.imageWidth, result.detection.imageHeight);
            if (this.videoStream != null) {
              const canvas = this.$refs.selfVideoOverlay;
              const video = this.$refs.selfVideo;
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              if (ctx != null) {
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'rgba(255, 255, 0, 0.75)';
                ctx.rect(result.detection.box.x, result.detection.box.y, result.detection.box.width, result.detection.box.height);
                ctx.stroke();
              }
              if (this.selfLive2DType != null && this.$refs.previewLive2D) {
                this.$refs.previewLive2D.setPoint(pitch * this.hSensitive, yaw * this.vSensitive);
              }
            }
          } else if (this.selfLive2DType != null && this.$refs.previewLive2D) {
            const canvas = this.$refs.selfVideoOverlay;
            const video = this.$refs.selfVideo;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            this.$refs.previewLive2D.setPoint(0, 0);
          }
          setTimeout(() => this.faceDetect(), 100);
        }
      },
      async changeCharacter() {
        this.selfLive2DType = await getNextCharacter(this.selfLive2DType || undefined);
      },
      async changeTexture() {
        this.selfLive2DType = await getNextTexture(this.selfLive2DType || undefined);
      },
    },
  };
</script>

<style>
  html {
    user-select: none;
    background: #171717;
  }

  html, body {
    overflow: hidden;
  }

  .self-video {
    display: block;
    width: 100%;
    transform: scaleX(-1);
  }

  .self-video-overlap {
    position: absolute;
    z-index: 999;
  }

  /*noinspection CssUnusedSymbol*/
  .v-dialog {
    overflow-y: visible !important;
  }
</style>
