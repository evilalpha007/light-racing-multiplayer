import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, PerspectiveCamera } from '@react-three/drei';

interface CarModel3DProps {
  modelPath: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}

function CarModel3D({ modelPath, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }: CarModel3DProps) {
  const { scene } = useGLTF(modelPath);
  
  return (
    <primitive 
      object={scene.clone()} 
      position={position} 
      rotation={rotation}
      scale={scale}
    />
  );
}

interface CarPreview3DProps {
  modelPath: string;
  autoRotate?: boolean;
  showControls?: boolean;
}

export const CarPreview3D: React.FC<CarPreview3DProps> = ({ 
  modelPath, 
  autoRotate = true,
  showControls = false 
}) => {
  return (
    <div className="w-full h-full">
      <Canvas>
        <PerspectiveCamera makeDefault position={[5, 2, 5]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />
        <pointLight position={[0, 5, 0]} intensity={0.5} />
        
        {/* Environment */}
        <Environment preset="sunset" />
        
        {/* Car Model */}
        <Suspense fallback={null}>
          <CarModel3D 
            modelPath={modelPath} 
            position={[0, -1, 0]}
            scale={1.5}
          />
        </Suspense>
        
        {/* Camera Controls */}
        <OrbitControls 
          enableZoom={showControls}
          enablePan={false}
          autoRotate={autoRotate}
          autoRotateSpeed={2}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
};

// Preload all car models
export const preloadCarModels = (modelPaths: string[]) => {
  modelPaths.forEach(path => {
    useGLTF.preload(path);
  });
};
