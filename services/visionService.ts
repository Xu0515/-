import { FilesetResolver, HandLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import { HandGesture } from "../types";

export class VisionService {
  private handLandmarker: HandLandmarker | null = null;
  private video: HTMLVideoElement | null = null;
  private lastVideoTime = -1;
  private isRunning = false;

  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    this.video = videoElement;
    
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );

    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numHands: 1,
    });

    this.isRunning = true;
  }

  detect(): { gesture: HandGesture; landmarks: any } | null {
    if (!this.handLandmarker || !this.video || !this.isRunning) return null;

    const nowInMs = Date.now();
    if (this.video.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.video.currentTime;
      const results = this.handLandmarker.detectForVideo(this.video, nowInMs);

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        
        // Key Points
        const wrist = landmarks[0];
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];
        const palmCenter = landmarks[9]; // Approx center

        // Gesture Logic
        const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
        
        // Average distance from tips to wrist
        const tips = [indexTip, middleTip, ringTip, pinkyTip];
        let totalDist = 0;
        tips.forEach(tip => {
            totalDist += Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
        });
        const avgWristDist = totalDist / 4;

        let gestureName: HandGesture['name'] = 'NONE';

        if (pinchDist < 0.05) {
            gestureName = 'PINCH';
        } else if (avgWristDist < 0.25) { // Adjusted based on normalized coords
            gestureName = 'FIST';
        } else if (avgWristDist > 0.4) {
            gestureName = 'OPEN';
        }

        return {
            gesture: {
                name: gestureName,
                position: { x: palmCenter.x, y: palmCenter.y }
            },
            landmarks: landmarks
        };
      }
    }
    return null;
  }

  stop() {
    this.isRunning = false;
    this.handLandmarker?.close();
  }
}

export const visionService = new VisionService();