/**
 * nexus-three.js
 * Three.js 3D particle network — runs on desktop (>= 768px) only.
 * Mobile gets a lightweight 2D canvas version from nexus-particles.js.
 */
(function () {
    'use strict';

    if (window.innerWidth < 768) return;

    var canvas = document.getElementById('nexus-canvas');
    if (!canvas || typeof THREE === 'undefined') return;

    /* ── Renderer ── */
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    /* ── Scene / Camera ── */
    var scene  = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 60);

    /* ── Mouse parallax ── */
    var mouseX = 0, mouseY = 0, targetX = 0, targetY = 0;
    document.addEventListener('mousemove', function (e) {
        mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    /* ── Nodes ── */
    var NODE_COUNT = 55;
    var nodes    = [];
    var nodeGeo  = new THREE.SphereGeometry(0.25, 6, 6);
    var nodeMat  = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
    var nodeMat2 = new THREE.MeshBasicMaterial({ color: 0xbc13fe });

    for (var i = 0; i < NODE_COUNT; i++) {
        var mat  = Math.random() > 0.7 ? nodeMat2 : nodeMat;
        var mesh = new THREE.Mesh(nodeGeo, mat);
        mesh.position.set(
            (Math.random() - 0.5) * 160,
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 80
        );
        var speed = {
            x: (Math.random() - 0.5) * 0.03,
            y: (Math.random() - 0.5) * 0.03,
            z: (Math.random() - 0.5) * 0.02
        };
        nodes.push({ mesh: mesh, speed: speed });
        scene.add(mesh);
    }

    /* ── Connection lines ── */
    var lineMat  = new THREE.LineBasicMaterial({ color: 0x00f2ff, transparent: true, opacity: 0.12 });
    var lineMat2 = new THREE.LineBasicMaterial({ color: 0xbc13fe, transparent: true, opacity: 0.08 });
    var lineObjs = [];
    var MAX_DIST = 24;

    function rebuildLines() {
        lineObjs.forEach(function (l) { scene.remove(l); });
        lineObjs.length = 0;
        for (var a = 0; a < nodes.length; a++) {
            for (var b = a + 1; b < nodes.length; b++) {
                var dist = nodes[a].mesh.position.distanceTo(nodes[b].mesh.position);
                if (dist < MAX_DIST) {
                    var geo = new THREE.BufferGeometry().setFromPoints([
                        nodes[a].mesh.position.clone(),
                        nodes[b].mesh.position.clone()
                    ]);
                    var lm   = Math.random() > 0.5 ? lineMat : lineMat2;
                    var line = new THREE.Line(geo, lm);
                    scene.add(line);
                    lineObjs.push(line);
                }
            }
        }
    }

    /* ── Rings ── */
    var rings = [];
    for (var r = 0; r < 2; r++) {
        var rGeo = new THREE.RingGeometry(20 + r * 18, 20.4 + r * 18, 48);
        var rMat = new THREE.MeshBasicMaterial({
            color: r % 2 === 0 ? 0x00f2ff : 0xbc13fe,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.04
        });
        var ring = new THREE.Mesh(rGeo, rMat);
        ring.rotation.x = Math.PI / 4 + r * 0.3;
        ring.rotation.y = r * 0.5;
        scene.add(ring);
        rings.push(ring);
    }

    /* ── Animation loop ── */
    var frame = 0;
    var REBUILD_INTERVAL = 90;

    function animate() {
        requestAnimationFrame(animate);
        frame++;

        /* Camera parallax */
        targetX += (mouseX * 4  - targetX) * 0.03;
        targetY += (-mouseY * 3 - targetY) * 0.03;
        camera.position.x = targetX;
        camera.position.y = targetY;
        camera.lookAt(scene.position);

        /* Move nodes */
        nodes.forEach(function (n) {
            n.mesh.position.x += n.speed.x;
            n.mesh.position.y += n.speed.y;
            n.mesh.position.z += n.speed.z;
            if (Math.abs(n.mesh.position.x) > 80) n.speed.x *= -1;
            if (Math.abs(n.mesh.position.y) > 50) n.speed.y *= -1;
            if (Math.abs(n.mesh.position.z) > 40) n.speed.z *= -1;
        });

        /* Rotate rings */
        rings.forEach(function (rg, idx) {
            rg.rotation.z += 0.001 * (idx % 2 === 0 ? 1 : -1);
            rg.rotation.y += 0.0005;
        });

        if (frame % REBUILD_INTERVAL === 0) rebuildLines();

        renderer.render(scene, camera);
    }

    rebuildLines();
    animate();

    /* Resize */
    window.addEventListener('resize', function () {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
})();
