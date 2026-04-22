import { useState, useMemo } from 'react';
import towerConfig from '../config/towerConfig.json';
import { isPointOnPath, isOverlappingTower } from '../utils/pathUtils'; // dodaj import

const MAX_FARM_TOWERS = 3;

function createTowerId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function useTowers({ money = 0, setMoney = () => {}, mapData } = {}) {
  const [towers, setTowers] = useState([]);
  const [selectedTowerId, setSelectedTowerId] = useState(null);
  const [shopSelectedType, setShopSelectedType] = useState(null);

  const selectedTower = useMemo(() => towers.find(t => t.id === selectedTowerId) || null, [towers, selectedTowerId]);

  const handleSelectShopTower = (type) => {
    setShopSelectedType(type);
    setSelectedTowerId(null); // Odznaczamy aktywną wieżę przy wyborze ze sklepu
  };

  const handleBoardRightClick = () => {
    if (shopSelectedType) {
      setShopSelectedType(null);
      return;
    }
    setSelectedTowerId(null);
  };

  const handlePlaceTower = (x, y) => {
    // Jeśli nic nie wybraliśmy ze sklepu, kliknięcie w puste miejsce odznacza wybraną wieżę
    if (!shopSelectedType) {
      setSelectedTowerId(null);
      return;
    }

    const TOWER_SIZE = 40;

    // 1. Sprawdź kolizję ze ścieżką
    if (mapData && isPointOnPath(x, y, mapData.path, mapData.pathWidth)) {
      return; 
    }

    // 2. Sprawdź kolizję z innymi wieżami (KLUCZOWA NAPRAWA)
    const overlaps = towers.some(t => isOverlappingTower(x, y, t.x, t.y, TOWER_SIZE));
    if (overlaps) {
      // Jeśli kliknęliśmy na inną wieżę mając coś w "ręce", 
      // po prostu nic nie rób (nie stawiaj i nie odznaczaj sklepu)
      return;
    }

    // 3. Sprawdź fundusze
    const levelData = towerConfig[shopSelectedType].levels[0];
    if (!levelData) return;

    if (shopSelectedType === 'farm-tower') {
      const currentFarmCount = towers.filter((tower) => tower.type === 'farm-tower').length;
      if (currentFarmCount >= MAX_FARM_TOWERS) {
        alert(`Limit farm osiągnięty (${MAX_FARM_TOWERS}).`);
        setShopSelectedType(null);
        return;
      }
    }

    if (money < levelData.cost) {
      alert('Brak monet!');
      setShopSelectedType(null);
      return;
    }

    const newTower = {
      id: createTowerId(),
      x: Math.round(x - TOWER_SIZE / 2),
      y: Math.round(y - TOWER_SIZE / 2),
      type: shopSelectedType,
      level: 0,
      cooldown: 0,
      targetingMode: 'first'
    };

    setMoney((prev) => prev - levelData.cost);
    setTowers((prev) => [...prev, newTower]);
    setShopSelectedType(null);
    setSelectedTowerId(null);
  };

  const handleSellTower = (towerId) => {
    const tower = towers.find((t) => t.id === towerId);
    if (!tower) return;
    const levels = towerConfig[tower.type].levels;
    const paidSum = levels.slice(0, tower.level + 1).reduce((s, lvl) => s + (lvl.cost || 0), 0);
    setTowers((prev) => prev.filter((t) => t.id !== towerId));
    setMoney((prev) => prev + Math.floor(paidSum / 2));
    setSelectedTowerId((prev) => (prev === towerId ? null : prev));
  };

  const handleUpgrade = (towerId) => {
    const tower = towers.find((t) => t.id === towerId);
    if (!tower) return;
    const nextLevel = tower.level + 1;
    const upgradeData = towerConfig[tower.type].levels[nextLevel];
    if (!upgradeData || money < upgradeData.cost) return;

    setMoney((prevMoney) => prevMoney - upgradeData.cost);
    setTowers((prevTowers) => prevTowers.map((t) => t.id === towerId ? { ...t, level: nextLevel } : t));
  };

  const handleTargetingChange = (towerId, mode) => {
    setTowers((prevTowers) => prevTowers.map((tower) => tower.id === towerId ? { ...tower, targetingMode: mode } : tower));
  };

  return {
    towers, setTowers, selectedTower, selectedTowerId, setSelectedTowerId,
    shopSelectedType, handleSelectShopTower, handleBoardRightClick,
    handlePlaceTower, handleSellTower, handleUpgrade, handleTargetingChange
  };
}