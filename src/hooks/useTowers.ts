// \hooks\useTowers.ts
import { useState, useMemo, Dispatch, SetStateAction } from 'react';
import towerConfigJson from '../config/towerConfig.json';
import { isPointOnPath, isOverlappingTower } from '../utils/pathUtils';
import { ECONOMY_BALANCE } from '../utils/economyUtils';
import { createTowerId } from '../utils/idUtils';
import { TOWER_SIZE } from '../config/gameConstants';
import { Tower, MapData, TowerTypeConfig, TargetingMode } from '../types/game';

const towerConfig = towerConfigJson as Record<string, TowerTypeConfig>;

interface UseTowersProps {
  money?: number;
  applyMoneyDelta?: (amount: number, source?: string, details?: any) => void;
  mapData: MapData | null;
}

interface UseTowersReturn {
  towers: Tower[];
  setTowers: Dispatch<SetStateAction<Tower[]>>;
  selectedTower: Tower | null;
  selectedTowerId: string | null;
  setSelectedTowerId: Dispatch<SetStateAction<string | null>>;
  shopSelectedType: string | null;
  handleSelectShopTower: (type: string) => void;
  handleBoardRightClick: () => void;
  handlePlaceTower: (x: number, y: number) => void;
  handleSellTower: (towerId: string) => void;
  handleUpgrade: (towerId: string) => void;
  handleTargetingChange: (towerId: string, mode: TargetingMode) => void;
}

export default function useTowers({ 
  money = 0, 
  applyMoneyDelta = () => {}, 
  mapData 
}: UseTowersProps): UseTowersReturn {
  const [towers, setTowers] = useState<Tower[]>([]);
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);
  const [shopSelectedType, setShopSelectedType] = useState<string | null>(null);

  const selectedTower = useMemo(() => 
    towers.find(t => t.id === selectedTowerId) || null, 
  [towers, selectedTowerId]);

  const handleSelectShopTower = (type: string) => {
    setShopSelectedType(type);
    setSelectedTowerId(null);
  };

  const handleBoardRightClick = () => {
    if (shopSelectedType) {
      setShopSelectedType(null);
      return;
    }
    setSelectedTowerId(null);
  };

  const handlePlaceTower = (x: number, y: number) => {
    if (!shopSelectedType) {
      setSelectedTowerId(null);
      return;
    }

    if (mapData && isPointOnPath(x, y, mapData.path, mapData.pathWidth)) {
      return; 
    }

    const overlaps = towers.some(t => isOverlappingTower(x, y, t.x, t.y, TOWER_SIZE));
    if (overlaps) {
      return;
    }

    const config = towerConfig[shopSelectedType];
    if (!config) return;
    const levelData = config.levels[0];
    if (!levelData) return;

    if (shopSelectedType === 'farm-tower') {
      const ECONOMY: any = ECONOMY_BALANCE; // Casting for simplicity where balance props might not be fully typed in JSON
      const currentFarmCount = towers.filter((tower) => tower.type === 'farm-tower').length;
      const maxFarms = ECONOMY.maxFarmTowers || 5;
      if (currentFarmCount >= maxFarms) {
        alert(`Limit farm osiągnięty (${maxFarms}).`);
        setShopSelectedType(null);
        return;
      }
    }

    if (money < levelData.cost) {
      alert('Brak monet!');
      setShopSelectedType(null);
      return;
    }

    const newTower: Tower = {
      id: createTowerId(),
      x: Math.round(x - TOWER_SIZE / 2),
      y: Math.round(y - TOWER_SIZE / 2),
      type: shopSelectedType,
      level: 0,
      cooldown: 0,
      targetingMode: 'first',
      isShooting: false,
      shootingTimer: 0
    };

    applyMoneyDelta(-levelData.cost, 'tower_purchase', { towerType: shopSelectedType, level: 0 });
    setTowers((prev) => [...prev, newTower]);
    setShopSelectedType(null);
    setSelectedTowerId(null);
  };

  const handleSellTower = (towerId: string) => {
    const tower = towers.find((t) => t.id === towerId);
    if (!tower) return;
    const config = towerConfig[tower.type];
    if (!config) return;
    const levels = config.levels;
    const paidSum = levels.slice(0, tower.level + 1).reduce((s, lvl) => s + (lvl.cost || 0), 0);
    setTowers((prev) => prev.filter((t) => t.id !== towerId));
    applyMoneyDelta(Math.floor(paidSum / 2), 'tower_sell', { towerType: tower.type, level: tower.level });
    setSelectedTowerId((prev) => (prev === towerId ? null : prev));
  };

  const handleUpgrade = (towerId: string) => {
    const tower = towers.find((t) => t.id === towerId);
    if (!tower) return;
    const config = towerConfig[tower.type];
    if (!config) return;
    const nextLevel = tower.level + 1;
    const upgradeData = config.levels[nextLevel];
    if (!upgradeData || money < upgradeData.cost) return;

    applyMoneyDelta(-upgradeData.cost, 'tower_upgrade', { towerType: tower.type, level: nextLevel });
    setTowers((prevTowers) => prevTowers.map((t) => t.id === towerId ? { ...t, level: nextLevel } : t));
  };

  const handleTargetingChange = (towerId: string, mode: TargetingMode) => {
    setTowers((prevTowers) => prevTowers.map((tower) => tower.id === towerId ? { ...tower, targetingMode: mode } : tower));
  };

  return {
    towers, setTowers, selectedTower, selectedTowerId, setSelectedTowerId,
    shopSelectedType, handleSelectShopTower, handleBoardRightClick,
    handlePlaceTower, handleSellTower, handleUpgrade, handleTargetingChange
  };
}
