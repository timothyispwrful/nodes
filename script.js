class MindMap {
    constructor() {
        this.nodes = [{ id: 0, text: "Root Node", x: 50, y: 50, parentId: null, children: [] }];
        this.loadFromStorage();
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
        const newId = Math.max(...this.nodes.map(n => n.id)) + 1;
        const newNode = {
            id: newId,
            text: `Node ${newId}`,
            x: parentNode.x + 150,
            y: parentNode.y + 50,
            parentId: parentId,
            children: []
        };
        parentNode.children.push(newId);
        this.nodes.push(newNode);
        this.saveToStorage();
        this.render();
    }

    deleteNode(id) {
        if (id === 0) return; // Can't delete root
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

    render() {
        const container = document.getElementById('mindmap-container');
        container.innerHTML = '';
        
        // Render nodes
        this.nodes.forEach(node => {
            const div = document.createElement('div');
            div.className = 'node';
            div.dataset.id = node.id;
            div.style.left = `${node.x}px`;
            div.style.top = `${node.y}px`;
            div.innerHTML = node.text;
            container.appendChild(div);
        });

        // Render lines
        this.nodes.forEach(node => {
            if (node.parentId !== null) {
                const parent = this.nodes.find(n => n.id === node.parentId);
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
        });
    }

    initEventListeners() {
        const container = document.getElementById('mindmap-container');
        
        container.addEventListener('click', (e) => {
            const node = e.target.closest('.node');
            if (node) {
                const id = parseInt(node.dataset.id);
                this.addNode(id);
            }
        });

        container.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const node = e.target.closest('.node');
            if (node) {
                const id = parseInt(node.dataset.id);
                this.deleteNode(id);
            }
        });

        // Long hold for mobile
        let holdTimer;
        container.addEventListener('touchstart', (e) => {
            const node = e.target.closest('.node');
            if (node) {
                holdTimer = setTimeout(() => {
                    const id = parseInt(node.dataset.id);
                    this.deleteNode(id);
                }, 1000);
            }
        });

        container.addEventListener('touchend', () => clearTimeout(holdTimer));
        container.addEventListener('touchmove', () => clearTimeout(holdTimer));
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MindMap();
});
