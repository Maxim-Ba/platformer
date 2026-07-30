import type { ISkillsPort } from '@application/ports/ISkillsPort';
import { findSkillNode } from '@domain/constants/skill-trees';
import type { SkillCategory, SkillNodeDef } from '@domain/types/SkillTree';
import Phaser from 'phaser';

const CATEGORY_BUTTON_STYLE = {
  fontFamily: 'monospace',
  fontSize: '18px',
  color: '#94a3b8',
};

const CATEGORY_ACTIVE_STYLE = {
  fontFamily: 'monospace',
  fontSize: '18px',
  color: '#38bdf8',
};

const HEADER_STYLE = {
  fontFamily: 'monospace',
  fontSize: '20px',
  color: '#f8fafc',
};

const DETAIL_TITLE_STYLE = {
  fontFamily: 'monospace',
  fontSize: '24px',
  color: '#f8fafc',
};

const DETAIL_META_STYLE = {
  fontFamily: 'monospace',
  fontSize: '16px',
  color: '#94a3b8',
};

const DETAIL_BODY_STYLE = {
  fontFamily: 'monospace',
  fontSize: '18px',
  color: '#cbd5e1',
};

const TREE_AREA_RATIO = 0.58;

const NODE_SIZE = 72;
const LEVEL_GAP = 160;
const NODE_VERTICAL_GAP = 88;
const TREE_TOP_OFFSET = 48;

interface NodeVisual {
  node: SkillNodeDef;
  rect: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  x: number;
  y: number;
}

export interface SkillsTabPanel {
  setVisible: (visible: boolean) => void;
  handleKeyDown: (event: KeyboardEvent) => boolean;
  destroy: () => void;
}

function getSiblings(treeNodes: readonly SkillNodeDef[], node: SkillNodeDef): SkillNodeDef[] {
  return treeNodes.filter((entry) => entry.level === node.level);
}

function getFirstChild(node: SkillNodeDef): string | undefined {
  return node.childIds[0];
}

function createActionButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  depth: number,
  onClick: () => void,
): Phaser.GameObjects.Text {
  const button = scene.add
    .text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#38bdf8',
      backgroundColor: '#1e293b',
      padding: { x: 12, y: 6 },
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(depth)
    .setInteractive({ useHandCursor: true });

  button.on('pointerup', onClick);
  return button;
}

export function createSkillsTabPanel(
  scene: Phaser.Scene,
  skillsPort: ISkillsPort,
  x: number,
  y: number,
  width: number,
  height: number,
  depth: number,
): SkillsTabPanel {
  const staticObjects: Array<Phaser.GameObjects.Graphics | Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text> = [];
  const categoryButtons = new Map<SkillCategory, Phaser.GameObjects.Text>();
  const nodeVisuals = new Map<string, NodeVisual>();
  const edges = scene.add.graphics().setScrollFactor(0).setDepth(depth);
  staticObjects.push(edges);

  let activeCategory: SkillCategory = 'physical';
  let focusedNodeId: string | null = null;
  let visible = false;

  const trees = skillsPort.getTrees();

  const categoryRowY = y;
  const categoryGap = 220;
  const categoryStartX = x + 16;

  const treeAreaWidth = Math.floor(width * TREE_AREA_RATIO);
  const detailPanelX = x + treeAreaWidth + 24;
  const detailPanelWidth = width - treeAreaWidth - 24;
  const treeOriginX = x + 80;
  const treeOriginY = y + TREE_TOP_OFFSET;
  const treeHeight = height - TREE_TOP_OFFSET - 16;

  const detailPanelBackground = scene.add
    .rectangle(
      detailPanelX + detailPanelWidth / 2,
      treeOriginY + treeHeight / 2,
      detailPanelWidth,
      treeHeight,
      0x1e293b,
      0.65,
    )
    .setStrokeStyle(1, 0x334155, 1)
    .setScrollFactor(0)
    .setDepth(depth);
  staticObjects.push(detailPanelBackground);

  const detailTitleText = scene.add
    .text(detailPanelX + 20, treeOriginY + 20, 'Выберите скил', DETAIL_TITLE_STYLE)
    .setScrollFactor(0)
    .setDepth(depth + 1);
  staticObjects.push(detailTitleText);

  const detailStatusText = scene.add
    .text(detailPanelX + 20, treeOriginY + 56, '', DETAIL_META_STYLE)
    .setScrollFactor(0)
    .setDepth(depth + 1);
  staticObjects.push(detailStatusText);

  const detailDescriptionText = scene.add
    .text(detailPanelX + 20, treeOriginY + 96, 'Кликните на узел в дереве, чтобы увидеть описание.', {
      ...DETAIL_BODY_STYLE,
      wordWrap: { width: detailPanelWidth - 40 },
    })
    .setScrollFactor(0)
    .setDepth(depth + 1);
  staticObjects.push(detailDescriptionText);

  const skillPointsText = scene.add
    .text(x + width - 16, categoryRowY, '', HEADER_STYLE)
    .setOrigin(1, 0)
    .setScrollFactor(0)
    .setDepth(depth);
  staticObjects.push(skillPointsText);

  const learnButton = createActionButton(
    scene,
    detailPanelX + detailPanelWidth / 2,
    treeOriginY + treeHeight - 36,
    'Выучить',
    depth + 3,
    () => {
      tryLearnFocusedNode();
    },
  );
  learnButton.setVisible(false);
  staticObjects.push(learnButton);

  trees.forEach((tree, index) => {
    const button = scene.add
      .text(categoryStartX + index * categoryGap, categoryRowY, tree.label, CATEGORY_BUTTON_STYLE)
      .setScrollFactor(0)
      .setDepth(depth)
      .setInteractive({ useHandCursor: true });

    button.on('pointerup', () => {
      setActiveCategory(tree.category);
    });

    categoryButtons.set(tree.category, button);
    staticObjects.push(button);
  });

  const getNodeStatusLabel = (nodeId: string): string => {
    if (skillsPort.getSelectedNodeIds().includes(nodeId)) {
      return 'В loadout';
    }

    if (skillsPort.isNodeUnlocked(nodeId)) {
      return 'Изучен';
    }

    if (skillsPort.isNodeLearnable(nodeId)) {
      return 'Доступен для изучения';
    }

    return 'Заблокирован';
  };

  const updateDetailPanel = (): void => {
    if (!focusedNodeId) {
      detailTitleText.setText('Выберите скил');
      detailStatusText.setText('');
      detailDescriptionText.setText('Кликните на узел в дереве, чтобы увидеть описание.');
      return;
    }

    const node = findSkillNode(focusedNodeId);
    if (!node) {
      detailTitleText.setText('Выберите скил');
      detailStatusText.setText('');
      detailDescriptionText.setText('Кликните на узел в дереве, чтобы увидеть описание.');
      return;
    }

    detailTitleText.setText(node.label);
    detailStatusText.setText(`Уровень ${node.level} · ${getNodeStatusLabel(node.id)}`);
    detailDescriptionText.setText(node.description);
  };

  const computeNodePositions = (nodes: readonly SkillNodeDef[]): Map<string, { x: number; y: number }> => {
    const positions = new Map<string, { x: number; y: number }>();

    for (let level = 1; level <= 4; level += 1) {
      const levelNodes = nodes.filter((node) => node.level === level);
      const columnX = treeOriginX + (level - 1) * LEVEL_GAP;
      const totalHeight = (levelNodes.length - 1) * NODE_VERTICAL_GAP;
      const startY = treeOriginY + treeHeight / 2 - totalHeight / 2;

      levelNodes.forEach((node, index) => {
        positions.set(node.id, {
          x: columnX,
          y: startY + index * NODE_VERTICAL_GAP,
        });
      });
    }

    return positions;
  };

  const refreshSkillPoints = (): void => {
    skillPointsText.setText(`Очки скилов: ${skillsPort.getAvailableSkillPoints()}`);
  };

  const updateLearnButton = (): void => {
    const canLearn =
      focusedNodeId !== null &&
      skillsPort.getAvailableSkillPoints() > 0 &&
      skillsPort.isNodeLearnable(focusedNodeId);

    learnButton.setVisible(visible && canLearn);
    learnButton.setAlpha(canLearn ? 1 : 0.35);
    if (canLearn) {
      learnButton.setInteractive({ useHandCursor: true });
    } else {
      learnButton.disableInteractive();
    }
  };

  const refreshPanel = (): void => {
    refreshSkillPoints();
    applyNodeStyles();
    updateDetailPanel();
    updateLearnButton();
  };

  const setCategoryButtonStyles = (): void => {
    categoryButtons.forEach((button, category) => {
      const style = category === activeCategory ? CATEGORY_ACTIVE_STYLE : CATEGORY_BUTTON_STYLE;
      button.setStyle(style);
    });
  };

  const destroyNodeVisuals = (): void => {
    nodeVisuals.forEach((visual) => {
      visual.rect.destroy();
      visual.label.destroy();
    });
    nodeVisuals.clear();
    edges.clear();
  };

  const getNodeColors = (nodeId: string): { fill: number; stroke: number; text: string } => {
    const isUnlocked = skillsPort.isNodeUnlocked(nodeId);
    const isLearnable = skillsPort.isNodeLearnable(nodeId);
    const isSelected = skillsPort.getSelectedNodeIds().includes(nodeId);
    const isFocused = focusedNodeId === nodeId;

    if (isSelected) {
      return { fill: 0x0c4a6e, stroke: 0x38bdf8, text: '#38bdf8' };
    }

    if (isLearnable && skillsPort.getAvailableSkillPoints() > 0) {
      return {
        fill: 0x422006,
        stroke: isFocused ? 0xfbbf24 : 0xd97706,
        text: isFocused ? '#fde68a' : '#fbbf24',
      };
    }

    if (!isUnlocked) {
      return { fill: 0x1e293b, stroke: 0x475569, text: '#64748b' };
    }

    if (isFocused) {
      return { fill: 0x1e3a5f, stroke: 0x7dd3fc, text: '#f8fafc' };
    }

    return { fill: 0x1e293b, stroke: 0x94a3b8, text: '#e2e8f0' };
  };

  const applyNodeStyles = (): void => {
    nodeVisuals.forEach((visual, nodeId) => {
      const colors = getNodeColors(nodeId);
      visual.rect.setFillStyle(colors.fill, 0.95);
      visual.rect.setStrokeStyle(nodeId === focusedNodeId ? 3 : 2, colors.stroke, 1);
      visual.label.setColor(colors.text);
    });
  };

  const drawEdges = (nodes: readonly SkillNodeDef[], positions: Map<string, { x: number; y: number }>): void => {
    edges.clear();
    edges.lineStyle(2, 0x475569, 0.9);

    for (const node of nodes) {
      if (!node.parentId) {
        continue;
      }

      const from = positions.get(node.parentId);
      const to = positions.get(node.id);
      if (!from || !to) {
        continue;
      }

      edges.beginPath();
      edges.moveTo(from.x + NODE_SIZE / 2, from.y);
      edges.lineTo(to.x - NODE_SIZE / 2, to.y);
      edges.strokePath();
    }
  };

  const toggleNodeSelection = (nodeId: string): void => {
    if (!skillsPort.isNodeUnlocked(nodeId)) {
      return;
    }

    if (skillsPort.getSelectedNodeIds().includes(nodeId)) {
      skillsPort.deselectNode(nodeId);
      return;
    }

    skillsPort.selectNode(nodeId);
  };

  const focusNode = (nodeId: string): void => {
    focusedNodeId = nodeId;
    refreshPanel();
  };

  const tryLearnFocusedNode = (): boolean => {
    if (!focusedNodeId) {
      return false;
    }

    if (!skillsPort.learnNode(focusedNodeId)) {
      return false;
    }

    refreshPanel();
    return true;
  };

  const onNodeClick = (nodeId: string): void => {
    focusNode(nodeId);

    if (skillsPort.isNodeUnlocked(nodeId)) {
      toggleNodeSelection(nodeId);
      refreshPanel();
    }
  };

  const renderTree = (): void => {
    destroyNodeVisuals();

    const tree = trees.find((entry) => entry.category === activeCategory);
    if (!tree) {
      return;
    }

    const positions = computeNodePositions(tree.nodes);
    drawEdges(tree.nodes, positions);

    for (const node of tree.nodes) {
      const position = positions.get(node.id);
      if (!position) {
        continue;
      }

      const rect = scene.add
        .rectangle(position.x, position.y, NODE_SIZE, NODE_SIZE, 0x1e293b, 0.95)
        .setScrollFactor(0)
        .setDepth(depth + 1)
        .setStrokeStyle(2, 0x94a3b8, 1);

      const label = scene.add
        .text(position.x, position.y, node.label, {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#e2e8f0',
          align: 'center',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(depth + 2);

      rect.setInteractive({ useHandCursor: true });
      rect.on('pointerup', () => {
        onNodeClick(node.id);
      });

      nodeVisuals.set(node.id, { node, rect, label, x: position.x, y: position.y });
      rect.setVisible(visible);
      label.setVisible(visible);
    }

    if (!focusedNodeId || !tree.nodes.some((node) => node.id === focusedNodeId)) {
      focusedNodeId = tree.nodes.find((node) => node.level === 1)?.id ?? tree.nodes[0]?.id ?? null;
    }

    refreshPanel();
  };

  const setActiveCategory = (category: SkillCategory): void => {
    activeCategory = category;
    const tree = trees.find((entry) => entry.category === category);
    focusedNodeId = tree?.nodes.find((node) => node.level === 1)?.id ?? null;
    setCategoryButtonStyles();
    renderTree();
  };

  const moveFocus = (direction: 'left' | 'right' | 'up' | 'down'): void => {
    if (!focusedNodeId) {
      return;
    }

    const tree = trees.find((entry) => entry.category === activeCategory);
    if (!tree) {
      return;
    }

    const currentNode = tree.nodes.find((node) => node.id === focusedNodeId);
    if (!currentNode) {
      return;
    }

    if (direction === 'left' && currentNode.parentId) {
      focusNode(currentNode.parentId);
      return;
    }

    if (direction === 'right') {
      const childId = getFirstChild(currentNode);
      if (childId) {
        focusNode(childId);
      }
      return;
    }

    const siblings = getSiblings(tree.nodes, currentNode);
    const currentIndex = siblings.findIndex((node) => node.id === currentNode.id);
    if (currentIndex === -1) {
      return;
    }

    if (direction === 'up' && currentIndex > 0) {
      focusNode(siblings[currentIndex - 1]!.id);
      return;
    }

    if (direction === 'down' && currentIndex < siblings.length - 1) {
      focusNode(siblings[currentIndex + 1]!.id);
    }
  };

  const handleKeyDown = (event: KeyboardEvent): boolean => {
    if (!visible) {
      return false;
    }

    if (event.code === 'ArrowLeft') {
      event.preventDefault();
      moveFocus('left');
      return true;
    }

    if (event.code === 'ArrowRight') {
      event.preventDefault();
      moveFocus('right');
      return true;
    }

    if (event.code === 'ArrowUp') {
      event.preventDefault();
      moveFocus('up');
      return true;
    }

    if (event.code === 'ArrowDown') {
      event.preventDefault();
      moveFocus('down');
      return true;
    }

    if (event.code === 'Enter' || event.code === 'Space') {
      event.preventDefault();
      if (!focusedNodeId) {
        return true;
      }

      if (
        skillsPort.getAvailableSkillPoints() > 0 &&
        skillsPort.isNodeLearnable(focusedNodeId)
      ) {
        tryLearnFocusedNode();
        return true;
      }

      if (skillsPort.isNodeUnlocked(focusedNodeId)) {
        toggleNodeSelection(focusedNodeId);
        refreshPanel();
      }

      return true;
    }

    return false;
  };

  setActiveCategory(activeCategory);

  return {
    setVisible: (nextVisible: boolean) => {
      visible = nextVisible;
      staticObjects.forEach((object) => object.setVisible(nextVisible));
      nodeVisuals.forEach((visual) => {
        visual.rect.setVisible(nextVisible);
        visual.label.setVisible(nextVisible);
      });
      if (nextVisible) {
        refreshPanel();
      } else {
        learnButton.setVisible(false);
      }
    },
    handleKeyDown,
    destroy: () => {
      destroyNodeVisuals();
      staticObjects.forEach((object) => object.destroy());
    },
  };
}
