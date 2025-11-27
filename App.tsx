
import React, { useState, useCallback, useRef } from 'react';
import ModelViewer, { ModelViewerRef } from './components/ModelViewer';
import Controls from './components/Controls';
import { AppState, ColorMode, GenerationResult, TextureStyle } from './types';
import { Settings } from 'lucide-react';

const App: React.FC = () => {
  const viewerRef = useRef<ModelViewerRef>(null);

  // Application State
  const [appState, setAppState] = useState<AppState>({
    mode: 'upload',
    prompt: '',

    // Geometry Defaults
    samplingStep: 3.0,
    particleSize: 1.5,
    particleShape: 'square',
    zExtrusion: 400,
    transparencyThreshold: 20,

    // Appearance Defaults
    colorMode: ColorMode.ORIGINAL,
    viewportMode: 'dark',
    brightness: 1.0,
    tintColor: '#ffffff',
    backgroundColor: '#000000', // Legacy, controlled by viewportMode now

    // Camera Defaults
    autoRotate: true,
    focusDistance: 0,
    aperture: 3.0,
    gridBrightness: 1.0,
  });

  // Generation Result State
  const [generation, setGeneration] = useState<GenerationResult>({
    imageUrl: null,
    loading: false,
    error: null,
    prompt: '',
  });

  const [isRecording, setIsRecording] = useState(false);
  const [controlsCollapsed, setControlsCollapsed] = useState(false);

  const handleStateChange = useCallback((newState: Partial<AppState>) => {
    setAppState((prev) => ({ ...prev, ...newState }));
  }, []);

  const handleUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setGeneration({
        imageUrl: result,
        loading: false,
        error: null,
        prompt: file.name
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!appState.prompt) return;

    setGeneration((prev) => ({ ...prev, loading: true, error: null }));

    try {
      if (appState.mode === 'text') {
        const canvas = document.createElement('canvas');
        const width = 800;
        const height = 750;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas unsupported');
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, width, height);
        const baseFont = 260;
        let fontSize = baseFont;
        const text = appState.prompt;
        const maxWidth = width * 0.9;
        ctx.font = `bold ${fontSize}px Arial`;
        let metrics = ctx.measureText(text);
        if (metrics.width > maxWidth) {
          fontSize = Math.max(60, Math.floor(baseFont * (maxWidth / metrics.width)));
          ctx.font = `bold ${fontSize}px Arial`;
          metrics = ctx.measureText(text);
        }
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const gradFill = ctx.createLinearGradient(0, 0, 0, height);
        gradFill.addColorStop(0, '#ffffff');
        // gradFill.addColorStop(0, '#ffffff');
        // gradFill.addColorStop(0, '#ffffff');
        ctx.filter = 'blur(0.6px)';
        ctx.fillStyle = gradFill;
        ctx.fillText(text, width / 2, height / 2);
        ctx.filter = 'none';
        ctx.fillStyle = gradFill;
        ctx.fillText(text, width / 2, height / 2);
        ctx.globalCompositeOperation = 'source-atop';
        const rg = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.min(width, height) * 0.6);
        rg.addColorStop(0, 'rgba(255,255,255,0.18)');
        rg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = rg;
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';
        const imageUrl = canvas.toDataURL('image/png');
        console.log('TEXT_IMAGE_BASE64:', imageUrl);
        setGeneration({
          imageUrl,
          loading: false,
          error: null,
          prompt: appState.prompt,
        });
      } else {
        // Fallback or placeholder for non-text mode if needed, or just do nothing/show error
        console.warn("Texture generation is disabled.");
        setGeneration((prev) => ({
          ...prev,
          loading: false,
          error: "Texture generation is currently disabled.",
        }));
      }
    } catch (err: any) {
      setGeneration((prev) => ({
        ...prev,
        loading: false,
        error: err.message || "Failed to generate texture. Please try again.",
      }));
    }
  }, [appState.prompt, appState.mode]);

  const handleExport = useCallback(() => {
    viewerRef.current?.exportPLY();
  }, []);

  const handleStartRecording = useCallback(async () => {
    if (viewerRef.current) {
      const started = await viewerRef.current.startRecording();
      if (started) {
        setIsRecording(true);
      }
    }
  }, []);

  const handleStopRecording = useCallback(() => {
    viewerRef.current?.stopRecording();
    setIsRecording(false);
  }, []);

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-black text-white font-sans overflow-hidden">

      {/* Main 3D Viewport */}
      <div className="flex-1 relative order-2 md:order-1 h-[40vh] md:h-auto flex flex-col min-w-0">
        <ModelViewer
          ref={viewerRef}
          textureUrl={generation.imageUrl}
          appState={appState}
          onStateChange={handleStateChange}
        />

        {/* Overlay Instructions if empty */}
        {!generation.imageUrl && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-gray-600 font-mono text-sm tracking-widest border border-gray-800 px-6 py-2 rounded bg-black/50 backdrop-blur">
              WAITING FOR INPUT STREAM...
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Controls */}
      {!controlsCollapsed && (
        <div className="order-1 md:order-2 h-[60vh] md:h-full z-10 shadow-2xl relative overflow-hidden w-full md:w-[400px] flex-shrink-0">
          <Controls
            state={appState}
            onStateChange={handleStateChange}
            onGenerate={handleGenerate}
            onUpload={handleUpload}
            onExport={handleExport}
            isGenerating={generation.loading}
            error={generation.error}
            collapsed={controlsCollapsed}
            onToggleCollapse={() => setControlsCollapsed((v) => !v)}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            isRecording={isRecording}
          />
        </div>
      )}

      {controlsCollapsed && (
        <button
          onClick={() => {
            console.log('Settings button clicked, setting collapsed to false');
            setControlsCollapsed(false);
          }}
          className="fixed top-3 right-3 z-[100] px-3 py-2 rounded-md bg-[#161b22] border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white flex items-center gap-2 shadow-lg"
          title="设置"
        >
          <Settings size={16} /> 设置
        </button>
      )}

    </div>
  );
};

export default App;
