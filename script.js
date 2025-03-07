class MindMap {
    constructor() {
        this.nodes = [{ id: 0, text: "Root Node", x: 50, y: 50, parentId: null, children: [], collapsed: false }];
        this.loadFromStorage();
        // Ensure root node is never collapsed on load
        const rootNode = this.nodes.find(n => n.id === 0);
        if (rootNode) rootNode.collapsed = false;
        this.saveToStorage();
        this.initEventListeners();
        this.render();
    }

    loadFromStorage() {
        const saved = localStorage.getItem('mindmap');
        if (saved) {
            this.nodes = JSON.parse(saved);
        }
    }

    saveToStorage() {
        localStorage.setItem('mindmap', JSON.stringify(this.nodes));
    }

    addNode(parentId) {
        const parentNode = this.nodes.find(n => n.id === parentId);
        const newId = Math.max(...this.nodes.map(n => n.id), 0) + 1;
        const newNode = {
            id: newId,
            text: `New Node`,
            x: parentNode.x + 150,
            y: parentNode.y + 50,
            parentId: parentId,
            children: [],
            collapsed: false
        };
        parentNode.children.push(newId);
        this.nodes.push(newNode);
        this.saveToStorage();
        this.render();
    }

    deleteNode(id) {
        if (id === 0) return; // Can't delete root
        if (!confirm("Are you sure you want to delete this node and its children?")) return;
        const node = this.nodes.find(n => n.id === id);
        const parent = this.nodes.find(n => n.id === node.parentId);
        parent.children = parent.children.filter(childId => childId !== id);
        this.nodes = this.nodes.filter(n => n.id !== id);
        this.nodes.forEach(n => {
            if (n.parentId === id) this.deleteNode(n.id);
        });
        this.saveToStorage();
        this.render();
    }

    editNode(id, newText) {
        const node = this.nodes.find(n => n.id === id);
        node.text = newText;
        this.saveToStorage();
        this.render();
    }

    toggleCollapse(id) {
        if (id === 0) return; // Prevent collapsing the root node
        const node = this.nodes.find(n => n.id === id);
        node.collapsed = !node.collapsed;
        this.saveToStorage();
        this.render();
    }

    moveNode(id, x, y) {
        const node = this.nodes.find(n => n.id === id);
        node.x = x;
        node.y = y;
        this.saveToStorage();
        this.render();
    }

    // Helper to check if a node should be visible
    isNodeVisible(node) {
        if (node.parentId === null) return true; // Root is always visible
        const parent = this.nodes.find(n => n.id === node.parentId);
        return !parent.collapsed && this.isNodeVisible(parent);
    }

    resetMindMap() {
        this.nodes = [{ id: 0, text: "Root Node", x: 50, y: 50, parentId: null, children: [], collapsed: false }];
        this.saveToStorage();
        this.render();
    }

    render() {
        const container = document.getElementById('mindmap-container');
        container.innerHTML = '';

        // Filter visible nodes
        const visibleNodes = this.nodes.filter(node => this.isNodeVisible(node));

        // Render nodes
        visibleNodes.forEach(node => {
            const div = document.createElement('div');
            div.className = `node ${node.collapsed ? 'collapsed' : ''}`;
            div.dataset.id = node.id;
            div.style.left = `${node.x}px`;
            div.style.top = `${node.y}px`;
            div.innerHTML = node.text;
            container.appendChild(div);
        });

        // Render lines (only between visible nodes)
        visibleNodes.forEach(node => {
            if (node.parentId !== null) {
                const parent = this.nodes.find(n => n.id === node.parentId);
                if (visibleNodes.includes(parent)) { // Only draw if parent is visible
                    const line = document.createElement('div');
                    line.className = 'line';
                    const dx = node.x - parent.x;
                    const dy = node.y - parent.y;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                    line.style.width = `${length}px`;
                    line.style.height = '2px';
                    line.style.left = `${parent.x + 20}px`;
                    line.style.top = `${parent.y + 15}px`;
                    line.style.transform = `rotate(${angle}deg)`;
                    container.insertBefore(line, container.firstChild);
                }
            }
        });
    }

    initEventListeners() {
        const container = document.getElementById('mindmap-container');
        const contextMenu = document.getElementById('context-menu');
        const newBtn = document.getElementById('new-btn');
        let draggedNode = null;
        let offsetX, offsetY;

        // New button to reset everything
        newBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to start a new mind map? All current data will be lost.")) {
                this.resetMindMap();
            }
        });

        // Single click to collapse/expand
        container.addEventListener('click', (e) => {
            const node = e.target.closest('.node');
            if (node && e.button === 0) {
                const id = parseInt(node.dataset.id);
                this.toggleCollapse(id);
                e.preventDefault();
            }
        });

        // Right-click for context menu
        container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const node = e.target.closest('.node');
            if (node) {
                const id = parseInt(node.dataset.id);
                contextMenu.style.display = 'block';
                contextMenu.style.left = `${e.pageX}px`;
                contextMenu.style.top = `${e.pageY}px`;
                contextMenu.dataset.nodeId = id;
            }
        });

        // Context menu actions
        contextMenu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            const id = parseInt(contextMenu.dataset.nodeId);
            switch (action) {
                case 'add':
                    this.addNode(id);
                    break;
                case 'edit':
                    const newText = prompt("Enter new text:", this.nodes.find(n => n.id === id).text);
                    if (newText) this.editNode(id, newText);
                    break;
                case 'delete':
                    this.deleteNode(id);
                    break;
            }
            contextMenu.style.display = 'none';
        });

        // Hide context menu when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!contextMenu.contains(e.target)) {
                contextMenu.style.display = 'none';
            }
        });

        // Dragging
        container.addEventListener('mousedown', (e) => {
            const node = e.target.closest('.node');
            if (node && e.button === 0) {
                draggedNode = node;
                const rect = node.getBoundingClientRect();
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (draggedNode) {
                const id = parseInt(draggedNode.dataset.id);
                const x = e.pageX - offsetX - container.offsetLeft;
                const y = e.pageY - offsetY - container.offsetTop;
                this.moveNode(id, x, y);
            }
        });

        document.addEventListener('mouseup', () => {
            draggedNode = null;
        });

        // Mobile support
        let touchNode = null;
        container.addEventListener('touchstart', (e) => {
            const node = e.target.closest('.node');
            if (node) {
                touchNode = node;
                const touch = e.touches[0];
                const rect = node.getBoundingClientRect();
                offsetX = touch.clientX - rect.left;
                offsetY = touch.clientY - rect.top;
            }
        });

        container.addEventListener('touchmove', (e) => {
            if (touchNode) {
                e.preventDefault();
                const touch = e.touches[0];
                const id = parseInt(touchNode.dataset.id);
                const x = touch.pageX - offsetX - container.offsetLeft;
                const y = touch.pageY - offsetY - container.offsetTop;
                this.moveNode(id, x, y);
            }
        });

        container.addEventListener('touchend', () => {
            touchNode = null;
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MindMap();
});