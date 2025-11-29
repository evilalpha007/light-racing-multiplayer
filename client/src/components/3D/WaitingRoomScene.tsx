import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, PerspectiveCamera, Text } from '@react-three/drei';
import type { RoomPlayer } from '../../../../shared/types';
import { getCarById } from '../../constants/carModels';

interface CarModel3DProps {
  modelPath: string;
  position: [number, number, number];
  playerName: string;
}

function CarModel3D({ modelPath, position, playerName }: CarModel3DProps) {
  const { scene } = useGLTF(modelPath);
  
  return (
    <group position={position}>
      <primitive 
        object={scene.clone()} 
        position={[0, 0, 0]}
        scale={0.8}
      />
      {/* Player name above car */}
      <Text
        position={[0, 2, 0]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.08}
        outlineColor="black"
        fontWeight="bold"
      >
        {playerName}
      </Text>
    </group>
  );
}

interface WaitingRoomSceneProps {
  players: RoomPlayer[];
}

export const WaitingRoomScene: React.FC<WaitingRoomSceneProps> = ({ players }) => {
  // Position cars based on player count
  const getCarPosition = (index: number, total: number): [number, number, number] => {
    if (total === 1) return [0, 0, 0];
    if (total === 2) return index === 0 ? [-2, 0, 0] : [2, 0, 0];
    if (total === 3) return index === 0 ? [-3, 0, 0] : index === 1 ? [0, 0, 0] : [3, 0, 0];
    // For 4+ players, arrange in a grid
    const spacing = 2.5;
    const cols = 2;
    const row = Math.floor(index / cols);
    const col = index % cols;
    return [(col - 0.5) * spacing * 2, 0, row * spacing];
  };

  return (
    <div className="w-full h-full">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 5, 10]} />
        
        {/* Lighting */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} />
        <directionalLight position={[-10, 10, -5]} intensity={0.6} />
        <pointLight position={[0, 8, 0]} intensity={1} />
        <spotLight position={[0, 12, 0]} angle={0.4} intensity={0.8} />
        
        {/* Environment */}
        <Environment preset="sunset" />
        
        {/* Ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[30, 30]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        
        {/* Render all player cars */}
        <Suspense fallback={null}>
          {players.map((player, index) => {
            const car = getCarById(player.selectedCar || 'dodge-challenger');
            if (!car) return null;
            
            return (
              <CarModel3D
                key={player.userId}
                modelPath={car.modelPath}
                position={getCarPosition(index, players.length)}
                playerName={player.username}
              />
            );
          })}
        </Suspense>
        
        {/* Camera Controls */}
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          autoRotate={true}
          autoRotateSpeed={0.5}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.2}
          minDistance={8}
          maxDistance={20}
        />
      </Canvas>
    </div>
  );
};
