
export enum ColorMode {
  ORIGINAL = '原色 (ORIGINAL)',
  COOL_BLACK = '极地酷黑 (COOL BLACK)',
  CYBERPUNK = '赛博朋克 (CYBERPUNK)',
  MATRIX = '黑客帝国 (MATRIX)',
  GOLDEN = '黑金流光 (GOLDEN)',
  OCEAN = '深海蓝调 (OCEAN)',
  INFERNO = '地狱烈火 (INFERNO)',
  VAPORWAVE = '蒸汽波 (VAPORWAVE)',
  ARCTIC = '极地冰川 (ARCTIC)',
  MONO = '黑白胶片 (MONO)',
  SEPIA = '复古怀旧 (SEPIA)',
  BLUEPRINT = '工程蓝图 (BLUEPRINT)'
}

export enum TextureStyle {
  PIXEL_ART = 'Pixel Art',
  VOXEL = 'Voxel',
  REALISTIC = 'Realistic',
  CARTOON = 'Cartoon',
  CYBERPUNK = 'Cyberpunk',
  HAND_PAINTED = 'Hand Painted'
}

export type ViewportMode = 'dark' | 'bright' | 'transparent';
export type ParticleShape = 'square' | 'circle' | 'diamond';

export interface GenerationResult {
  imageUrl: string | null;
  loading: boolean;
  error: string | null;
  prompt: string;
}

export interface AppState {
  // Mode
  mode: 'upload' | 'text';
  
  // Content
  prompt: string;
  
  // Geometry Parameters
  samplingStep: number;      // 采样密度 (px step) - smaller is denser
  particleSize: number;      // 粒子大小
  particleShape: ParticleShape; // 粒子形状
  zExtrusion: number;        // Z轴 挤出深度
  transparencyThreshold: number; // 透明度过滤
  
  // Appearance
  colorMode: ColorMode;
  brightness: number;        // 粒子亮度
  tintColor: string;         // 粒子色调
  backgroundColor: string;   // Not used directly if viewportMode is set, but kept for legacy
  viewportMode: ViewportMode; // 视口模式

  // Camera/View
  autoRotate: boolean;
  focusDistance: number;     // 对焦距离
  aperture: number;          // 光圈虚化
  gridBrightness: number;    // Grid亮度(0.1-1.0)
}
