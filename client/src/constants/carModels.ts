// Available car models from public/models directory

export interface CarModel {
  id: string;
  name: string;
  modelPath: string;
  thumbnailColor: string; // For thumbnail background
  description: string;
}

export const CAR_MODELS: CarModel[] = [
  {
    id: 'dodge-challenger',
    name: '2015 Dodge Challenger',
    modelPath: '/models/2015 Dodge Challenger.glb',
    thumbnailColor: '#FF4444',
    description: 'Muscle car with raw power'
  },
  {
    id: 'car-model',
    name: 'Sports Car',
    modelPath: '/models/CAR Model.glb',
    thumbnailColor: '#4444FF',
    description: 'Classic sports car'
  },
  {
    id: 'camaro-zl1',
    name: 'Camaro ZL1 2017',
    modelPath: '/models/Camaro ZL1 2017.glb',
    thumbnailColor: '#FFD700',
    description: 'Modern muscle beast'
  },
  {
    id: 'convertible',
    name: 'Convertible',
    modelPath: '/models/Convertible.glb',
    thumbnailColor: '#FF69B4',
    description: 'Luxury convertible'
  },
  {
    id: 'cybertruck',
    name: 'Cybertruck',
    modelPath: '/models/Cybertruck.glb',
    thumbnailColor: '#C0C0C0',
    description: 'Futuristic electric truck'
  },
  {
    id: 'dominus',
    name: 'Dominus',
    modelPath: '/models/Dominus Body v2.glb',
    thumbnailColor: '#9400D3',
    description: 'Rocket League inspired'
  },
  {
    id: 'go-kart-1',
    name: 'Go Kart Pro',
    modelPath: '/models/Go Kart (1).glb',
    thumbnailColor: '#00FF00',
    description: 'Racing kart'
  },
  {
    id: 'go-kart-2',
    name: 'Go Kart Classic',
    modelPath: '/models/Go kart.glb',
    thumbnailColor: '#32CD32',
    description: 'Classic kart'
  },
  {
    id: 'jeep-1',
    name: 'Jeep Off-Road',
    modelPath: '/models/Jeep (1).glb',
    thumbnailColor: '#8B4513',
    description: 'Off-road beast'
  },
  {
    id: 'jeep-2',
    name: 'Jeep',
    modelPath: '/models/Jeep.glb',
    thumbnailColor: '#A0522D',
    description: 'All-terrain vehicle'
  },
  {
    id: 'police-car',
    name: 'Police Car',
    modelPath: '/models/PoliceCar.glb',
    thumbnailColor: '#000080',
    description: 'Law enforcement'
  },
  {
    id: 'sports-car',
    name: 'Sports Car',
    modelPath: '/models/Sports Car.glb',
    thumbnailColor: '#FF6347',
    description: 'Speed demon'
  },
  {
    id: 'toyota-ae86',
    name: 'Toyota AE86',
    modelPath: '/models/Toyota AE86.glb',
    thumbnailColor: '#FFFFFF',
    description: 'Drift king'
  },
  {
    id: 'car',
    name: 'Classic Car',
    modelPath: '/models/car.glb',
    thumbnailColor: '#FF8C00',
    description: 'Timeless classic'
  }
];

// Default car for new players
export const DEFAULT_CAR_ID = 'dodge-challenger';

// Get car by ID
export const getCarById = (id: string): CarModel | undefined => {
  return CAR_MODELS.find(car => car.id === id);
};
