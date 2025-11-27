
import React, { useRef } from 'react';
import { AppState, ColorMode, ParticleShape, ViewportMode } from '../types';
import { Upload, Image as ImageIcon, Download, Share2, Type, RefreshCw, Box, Circle, Diamond, Sun, Moon, Monitor, Grid3X3, Palette, ChevronLeft, ChevronRight } from 'lucide-react';

interface ControlsProps {
    state: AppState;
    onStateChange: (newState: Partial<AppState>) => void;
    onGenerate: () => void;
    onUpload: (file: File) => void;
    onExport: () => void;
    isGenerating: boolean;
    error: string | null;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
    onStartRecording?: () => void;
    onStopRecording?: () => void;
    isRecording?: boolean;
}

const Controls: React.FC<ControlsProps> = ({ state, onStateChange, onGenerate, onUpload, onExport, isGenerating, collapsed = false, onToggleCollapse, onStartRecording, onStopRecording, isRecording = false }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onUpload(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) onUpload(file);
    };

    return (
        <div className="flex flex-col h-full bg-[#0d1117] w-full overflow-y-auto font-sans text-gray-300 border-l border-gray-800 scrollbar-thin scrollbar-thumb-gray-800">

            {/* Header */}
            <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-[#161b22] sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-md flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
                        <Box size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-white tracking-widest">NANOPIXEL</h1>
                        <p className="text-[10px] text-gray-500 font-mono">ENGINE V3.1</p>
                    </div>
                </div>
                <button
                    onClick={() => onToggleCollapse && onToggleCollapse()}
                    className="p-2 rounded-md bg-[#0d1117] border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
                    title="展开/收起"
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>

            {!collapsed && (
                <div className="p-5 space-y-8 pb-24">

                    {/* Mode Switcher */}
                    <div className="flex bg-[#1c2128] p-1 rounded-lg border border-gray-700">
                        <button
                            onClick={() => onStateChange({ mode: 'upload' })}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${state.mode === 'upload' ? 'bg-gray-700 text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <ImageIcon size={14} /> 图片合成模式
                        </button>
                        <button
                            onClick={() => onStateChange({ mode: 'text' })}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${state.mode === 'text' ? 'bg-gray-700 text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <Type size={14} /> 纯文字模式
                        </button>
                    </div>

                    {/* Upload Area */}
                    {state.mode === 'upload' && (
                        <div
                            className="border-2 border-dashed border-gray-700 rounded-xl bg-[#161b22] hover:bg-[#1c2128] transition-colors h-40 flex flex-col items-center justify-center gap-3 cursor-pointer group"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                        >
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
                                <Upload size={18} className="text-gray-400" />
                            </div>
                            <p className="text-xs text-gray-500">点击选择或拖拽图片至此</p>
                        </div>
                    )}

                    {/* Text Generation */}
                    {state.mode === 'text' && (
                        <div className="space-y-3">
                            <textarea
                                className="w-full h-28 bg-[#161b22] border border-gray-700 rounded-xl p-4 text-xs text-gray-200 focus:border-blue-500 outline-none resize-none transition-colors"
                                placeholder="输入描述生成纹理..."
                                value={state.prompt}
                                onChange={(e) => onStateChange({ prompt: e.target.value })}
                            />
                            <button
                                onClick={onGenerate}
                                disabled={isGenerating}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isGenerating ? '生成中...' : '开始生成'}
                            </button>
                        </div>
                    )}

                    {/* Geometry Parameters */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold text-blue-400 flex items-center gap-2">
                                <span className="text-lg">⚙</span> 几何参数
                            </h3>
                            <button
                                onClick={() => onStateChange({ autoRotate: !state.autoRotate })}
                                className={`p-1 rounded transition-colors ${state.autoRotate ? 'text-blue-400' : 'text-gray-600'}`}
                                title="Toggle Auto Rotate"
                            >
                                <RefreshCw size={14} className={state.autoRotate ? "animate-spin" : ""} />
                            </button>
                        </div>

                        {/* Particle Shape */}
                        <div className="flex bg-[#1c2128] p-1 rounded-lg border border-gray-700 mb-4">
                            {[
                                { id: 'circle', icon: Circle, label: '圆形' },
                                { id: 'square', icon: Box, label: '矩形' },
                                { id: 'diamond', icon: Diamond, label: '菱形' }
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => onStateChange({ particleShape: item.id as ParticleShape })}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-md transition-all ${state.particleShape === item.id ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                    title={item.label}
                                >
                                    <item.icon size={14} className={item.id === 'diamond' ? 'rotate-45' : ''} />
                                </button>
                            ))}
                        </div>

                        {/* Sampling Density */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-400 font-mono">
                                <span>采样密度 (Step)</span>
                                <span>{state.samplingStep.toFixed(1)}px</span>
                            </div>
                            <input
                                type="range" min="1" max="8" step="0.5"
                                value={state.samplingStep}
                                onChange={(e) => onStateChange({ samplingStep: parseFloat(e.target.value) })}
                                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gray-400 hover:accent-blue-400"
                            />
                        </div>

                        {/* Particle Size */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-400 font-mono">
                                <span>粒子大小</span>
                                <span>{state.particleSize.toFixed(2)}</span>
                            </div>
                            <input
                                type="range" min="0.1" max="3" step="0.1"
                                value={state.particleSize}
                                onChange={(e) => onStateChange({ particleSize: parseFloat(e.target.value) })}
                                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        {/* Z Extrusion */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-400 font-mono">
                                <span>Z轴 挤出深度</span>
                                <span className="text-orange-400">{state.zExtrusion.toFixed(0)}</span>
                            </div>
                            <input
                                type="range" min="0" max="4000" step="10"
                                value={state.zExtrusion}
                                onChange={(e) => onStateChange({ zExtrusion: parseFloat(e.target.value) })}
                                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>

                        {/* Transparency */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-400 font-mono">
                                <span className="flex items-center gap-2">◇ 透明度过滤</span>
                                <span className="text-red-400">{state.transparencyThreshold}</span>
                            </div>
                            <input
                                type="range" min="0" max="255" step="1"
                                value={state.transparencyThreshold}
                                onChange={(e) => onStateChange({ transparencyThreshold: parseInt(e.target.value) })}
                                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>
                    </div>

                    {/* Color Palette */}
                    <div className="space-y-4 pt-4 border-t border-gray-800">
                        <h3 className="text-xs font-bold text-purple-400 flex items-center gap-2">
                            <span className="text-lg">🎨</span> 外观与色彩
                        </h3>

                        {/* Viewport Mode */}
                        <div className="flex bg-[#1c2128] p-1 rounded-lg border border-gray-700 mb-2">
                            {[
                                { id: 'dark', label: '深色视口', icon: Moon },
                                { id: 'bright', label: '明亮视口', icon: Sun },
                                { id: 'transparent', label: '透明背景', icon: Grid3X3 },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => onStateChange({ viewportMode: item.id as ViewportMode })}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 text-[10px] md:text-xs font-medium rounded-md transition-all ${state.viewportMode === item.id ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
                                        }`}
                                >
                                    <item.icon size={12} /> {item.label}
                                </button>
                            ))}
                        </div>

                        {/* Brightness & Tint */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-gray-400 font-mono">
                                    <span>亮度</span>
                                    <span className="text-yellow-400">{state.brightness.toFixed(1)}</span>
                                </div>
                                <input
                                    type="range" min="0" max="3" step="0.1"
                                    value={state.brightness}
                                    onChange={(e) => onStateChange({ brightness: parseFloat(e.target.value) })}
                                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-gray-400 font-mono">
                                    <span>色调</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={state.tintColor}
                                        onChange={(e) => onStateChange({ tintColor: e.target.value })}
                                        className="w-8 h-6 rounded cursor-pointer bg-transparent border-none"
                                    />
                                    <span className="text-[10px] font-mono text-gray-500">{state.tintColor}</span>
                                </div>
                            </div>
                        </div>

                        {/* Presets Grid */}
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {Object.values(ColorMode).map((mode) => {
                                const label = mode.split(' (')[0];
                                const subLabel = mode.match(/\((.*?)\)/)?.[1] || '';
                                const isActive = state.colorMode === mode;

                                return (
                                    <button
                                        key={mode}
                                        onClick={() => onStateChange({ colorMode: mode })}
                                        className={`px-3 py-2 rounded-lg text-left transition-all border ${isActive
                                            ? 'bg-[#21262d] border-purple-500/50 text-white'
                                            : 'bg-[#0d1117] border-transparent hover:bg-[#161b22] text-gray-500'
                                            }`}
                                    >
                                        <div className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-400'}`}>{label}</div>
                                        <div className="text-[10px] opacity-50 font-mono">{subLabel}</div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Camera Optics */}
                    <div className="space-y-4 pt-4 border-t border-gray-800">
                        <h3 className="text-xs font-bold text-green-400 flex items-center gap-2">
                            <span className="text-lg">📷</span> 相机光学
                        </h3>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-400 font-mono">
                                <span>对焦距离</span>
                                <span className="text-green-400">{state.focusDistance.toFixed(2)}</span>
                            </div>
                            <input
                                type="range" min="0" max="100" step="0.1"
                                value={state.focusDistance}
                                onChange={(e) => onStateChange({ focusDistance: parseFloat(e.target.value) })}
                                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-400 font-mono">
                                <span>光圈虚化</span>
                                <span className="text-green-400">{state.aperture.toFixed(2)}</span>
                            </div>
                            <input
                                type="range" min="0" max="10" step="0.1"
                                value={state.aperture}
                                onChange={(e) => onStateChange({ aperture: parseFloat(e.target.value) })}
                                className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>
                    </div>

                    {/* Video Recording */}
                    <div className="space-y-4 pt-4 border-t border-gray-800">
                        <h3 className="text-xs font-bold text-red-400 flex items-center gap-2">
                            <span className="text-lg">🎥</span> 视频录制
                        </h3>
                        <div className="flex gap-3">
                            {!isRecording ? (
                                <button
                                    onClick={onStartRecording}
                                    className="w-full py-3 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <div className="w-2 h-2 rounded-full bg-red-500" /> 开始录制
                                </button>
                            ) : (
                                <button
                                    onClick={onStopRecording}
                                    className="w-full py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 animate-pulse"
                                >
                                    <div className="w-2 h-2 rounded-sm bg-white" /> 停止录制 (Recording...)
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-6 space-y-3 pb-8">
                        <div className="flex gap-3">
                            <button className="flex-1 py-3 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-xs font-medium flex items-center justify-center gap-2">
                                <Download size={14} /> 导出 SVG
                            </button>
                            <button
                                onClick={onExport}
                                className="flex-1 py-3 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-xs font-medium flex items-center justify-center gap-2"
                            >
                                <Box size={14} /> 导出 PLY
                            </button>
                        </div>

                        <button className="w-full py-3 border border-gray-700 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors text-xs font-medium flex items-center justify-center gap-2">
                            <Share2 size={14} /> 分享到社交媒体
                        </button>
                    </div>

                    {/* Grid Brightness */}
                    <div className="space-y-2 pt-4 border-t border-gray-800">
                        <div className="flex justify-between text-xs text-gray-400 font-mono">
                            <span>Grid 亮度</span>
                            <span className="text-blue-400">{state.gridBrightness.toFixed(2)}</span>
                        </div>
                        <input
                            type="range" min="0.1" max="1" step="0.05"
                            value={state.gridBrightness}
                            onChange={(e) => onStateChange({ gridBrightness: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                </div>
            )}

            {!collapsed && (
                <div className="absolute bottom-0 w-full bg-[#0d1117]/90 backdrop-blur border-t border-gray-800 p-2 flex justify-between items-center text-[10px] text-gray-600 font-mono px-4 z-20">
                    <div className="flex items-center gap-2"><span className="text-lg">🌐</span> ZH</div>
                    <div className="flex gap-2">
                        <span className="bg-[#161b22] px-2 py-0.5 rounded">N: UI</span>
                        <span className="bg-[#161b22] px-2 py-0.5 rounded">O: RESET</span>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Controls;
