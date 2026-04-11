import { useState, useMemo } from 'react';
import towerConfig from '../config/towerConfig.json';
import mapConfig from '../config/mapConfig.json';
import { isPointOnPath } from '../utils/pathUtils';

export default function useTowers({ money = 0, setMoney = () => {} } = {}) {
  const [towers, setTowers] = useState([]);
  const [selectedTowerId, setSelectedTowerId] = useState(null);
  const [shopSelectedType, setShopSelectedType] = useState(null);

  const selectedTower = useMemo(() => towers.find(t => t.id === selectedTowerId) || null, [towers, selectedTowerId]);

  const handleSelectShopTower = (type) => {
    setShopSelectedType(type);
  };

  const handleBoardRightClick = () => {
    if (shopSelectedType) {
      setShopSelectedType(null);
      return;
    }
    if (selectedTowerId) setSelectedTowerId(null);
  };

  const handlePlaceTower = (x, y) => {
    if (!shopSelectedType) {
      setSelectedTowerId(null);
      return;
    }
    if (isPointOnPath(x, y, mapConfig.path, mapConfig.pathWidth)) {
      setShopSelectedType(null);
      return;
    }

    const half = 20;
    const levelData = towerConfig[shopSelectedType].levels[0];
    if (!levelData) return;
    if (money < levelData.cost) {
      // keep UI responsibilities (alerts) out of hooks when possible, but keep minimal feedback
      alert('Brak wystarczających środków.');
      return;
    }

    const newTower = {
      id: Date.now(),
      x: Math.round(x - half),
      y: Math.round(y - half),
      type: shopSelectedType,
      level: 0,
      cooldown: 0
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
    towers,
    setTowers,
    selectedTower,
    selectedTowerId,
    setSelectedTowerId,
    shopSelectedType,
    handleSelectShopTower,
    handleBoardRightClick,
    handlePlaceTower,
    handleSellTower,
    handleUpgrade,
    handleTargetingChange
  };
}
