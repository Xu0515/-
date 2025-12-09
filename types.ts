import * as THREE from 'three';

export enum AppMode {
  TREE = 'TREE',
  SCATTER = 'SCATTER',
  FOCUS = 'FOCUS',
}

export interface ParticleData {
  mesh: THREE.Object3D;
  velocity: THREE.Vector3;
  initialPos: THREE.Vector3;
  type: 'DECORATION' | 'PHOTO';
  rotationSpeed: THREE.Vector3;
}

export interface HandGesture {
  name: 'PINCH' | 'FIST' | 'OPEN' | 'NONE';
  position: { x: number; y: number };
}

export interface SceneConfig {
  particleCount: number;
  dustCount: number;
  colors: {
    gold: number;
    cream: number;
    red: number;
    green: number;
  };
}