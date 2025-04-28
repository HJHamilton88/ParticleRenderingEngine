import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const ParticleEngine = () => {
    const mountRef = useRef(null);
    const [density, setDensity] = useState(1);
    const [particleSize, setParticleSize] = useState(0.01);
    const [orbitSpeed, setOrbitSpeed] = useState(0.01);
    const [isOrbiting, setIsOrbiting] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('');
    const sceneRef = useRef(null);
    const pointsRef = useRef(null);
    const originalGeometryRef = useRef(null);
    const controlsRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const animationFrameRef = useRef(null);
    const currentRotationRef = useRef(0);

    // Effects and modes
    const [mode, setMode] = useState('edit'); // 'edit' or 'showcase'
    const [materialType, setMaterialType] = useState('phong');
    const [effectType, setEffectType] = useState('none');
    const [baseColor, setBaseColor] = useState('#ffffff');
    const [emissiveColor, setEmissiveColor] = useState('#000000');
    const [isGlittering, setIsGlittering] = useState(false);
    const [isPulsing, setIsPulsing] = useState(false);
    const [metalness, setMetalness] = useState(0);
    const [roughness, setRoughness] = useState(0.5);

    const particlesRef = useRef([]);
    const effectsTimeRef = useRef(0);

    // Scene setup
    useEffect(() => {
        if (!mountRef.current) return;

        const scene = new THREE.Scene();
        sceneRef.current = scene;
        scene.background = new THREE.Color(0x16124a);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        mountRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controlsRef.current = controls;

        const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
        directionalLight.position.set(0, 1, 0);
        scene.add(directionalLight);

        // Handle window resize
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            if (pointsRef.current) {
                scene.remove(pointsRef.current);
                pointsRef.current.geometry.dispose();
                pointsRef.current.material.dispose();
            }
            renderer.dispose();
            controls.dispose();
        };
    }, []);

    // Material creation based on type
    const createMaterial = () => {
        let material;
        switch (materialType) {
            case 'standard':
                material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(baseColor),
                    emissive: new THREE.Color(emissiveColor),
                    metalness: metalness,
                    roughness: roughness,
                });
                break;
            case 'phong':
                material = new THREE.MeshPhongMaterial({
                    color: new THREE.Color(baseColor),
                    emissive: new THREE.Color(emissiveColor),
                    shininess: 100,
                });
                break;
            case 'toon':
                material = new THREE.MeshToonMaterial({
                    color: new THREE.Color(baseColor),
                });
                break;
            default:
                material = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(baseColor),
                });
        }
        return material;
    };

    // Generate particles from geometry
    const generateParticles = (geometry, currentDensity) => {
        if (!sceneRef.current) return;

        if (pointsRef.current) {
            sceneRef.current.remove(pointsRef.current);
            pointsRef.current.geometry.dispose();
            pointsRef.current.material.dispose();
        }

        const positions = geometry.attributes.position.array;
        const totalPoints = positions.length / 3;
        const pointsToUse = Math.max(1, Math.floor(totalPoints * currentDensity));

        const material = createMaterial();
        const particleGeometry = new THREE.BoxGeometry(
            particleSize,
            particleSize,
            particleSize
        );

        const particles = new THREE.InstancedMesh(
            particleGeometry,
            material,
            pointsToUse
        );

        // Store individual particle data for effects
        particlesRef.current = [];
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3(1, 1, 1);
        let instanceIndex = 0;

        for (let i = 0; i < positions.length; i += 3) {
            if (Math.random() > currentDensity) continue;
            if (instanceIndex >= pointsToUse) break;

            position.set(
                positions[i],
                positions[i + 1],
                positions[i + 2]
            );

            // Store particle data for effects
            particlesRef.current.push({
                position: position.clone(),
                scale: scale.clone(),
                initialScale: scale.clone(),
                phase: Math.random() * Math.PI * 2, // Random phase for effects
            });

            matrix.compose(position, quaternion, scale);
            particles.setMatrixAt(instanceIndex, matrix);

            if (geometry.attributes.color) {
                const color = new THREE.Color(
                    geometry.attributes.color.array[i],
                    geometry.attributes.color.array[i + 1],
                    geometry.attributes.color.array[i + 2]
                );
                particles.setColorAt(instanceIndex, color);
            }

            instanceIndex++;
        }

        particles.rotation.y = currentRotationRef.current;
        pointsRef.current = particles;
        sceneRef.current.add(particles);
    };

    // Effect for density or particle size changes
    useEffect(() => {
        if (originalGeometryRef.current) {
            generateParticles(originalGeometryRef.current, density);
        }
    }, [density, particleSize, materialType, baseColor, emissiveColor, metalness, roughness]);

    // Handle file upload
    const handleFileUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoadingStatus('Loading file...');
        const extension = file.name.split('.').pop()?.toLowerCase();
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const result = e.target?.result;
                if (!result) throw new Error('Failed to read file');

                let geometry;
                switch (extension) {
                    case 'ply': {
                        const loader = new PLYLoader();
                        geometry = loader.parse(result);
                        break;
                    }
                    case 'obj': {
                        const loader = new OBJLoader();
                        const object = loader.parse(result);
                        const geometries = [];
                        object.traverse((child) => {
                            if (child.isMesh) {
                                geometries.push(child.geometry);
                            }
                        });
                        if (geometries.length > 0) {
                            geometry = geometries.length === 1 ?
                                geometries[0] :
                                BufferGeometryUtils.mergeGeometries(geometries);
                        } else {
                            throw new Error('No meshes found in OBJ file');
                        }
                        break;
                    }
                    case 'fbx': {
                        const loader = new FBXLoader();
                        const object = loader.parse(result);
                        const geometries = [];
                        object.traverse((child) => {
                            if (child.isMesh) {
                                geometries.push(child.geometry);
                            }
                        });
                        if (geometries.length > 0) {
                            geometry = geometries.length === 1 ?
                                geometries[0] :
                                BufferGeometryUtils.mergeGeometries(geometries);
                        } else {
                            throw new Error('No meshes found in OBJ file');
                        }
                        break;
                    }
                    default:
                        throw new Error('Unsupported file format');
                }

                if (geometry) {
                    geometry.computeVertexNormals();
                    // Reset rotation when loading a new model
                    currentRotationRef.current = 0;
                    // Update the original geometry reference
                    originalGeometryRef.current = geometry.clone();
                    // Generate particles with the new geometry
                    generateParticles(geometry, density);
                    setLoadingStatus('');
                }
            } catch (error) {
                console.error('Error processing file:', error);
                setLoadingStatus(`Error: ${error.message}`);
            }
        };

        reader.onerror = () => {
            setLoadingStatus('Error reading file');
        };

        if (extension === 'ply' || extension === 'fbx') {
            reader.readAsArrayBuffer(file);
        } else {
            reader.readAsText(file);
        }
    };

    // Enhanced animation loop with effects
    useEffect(() => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !controlsRef.current) return;

        const animate = () => {
            animationFrameRef.current = requestAnimationFrame(animate);
            effectsTimeRef.current += 0.016; // Approximate delta time

            if (pointsRef.current) {
                // Orbit rotation
                if (isOrbiting) {
                    currentRotationRef.current += orbitSpeed;
                    pointsRef.current.rotation.y = currentRotationRef.current;
                }

                // Particle effects
                if (isGlittering || isPulsing) {
                    const matrix = new THREE.Matrix4();
                    const quaternion = new THREE.Quaternion();

                    particlesRef.current.forEach((particle, index) => {
                        const scale = particle.scale.clone();

                        if (isPulsing) {
                            const pulseFactor = Math.sin(effectsTimeRef.current * 2 + particle.phase) * 0.2 + 1;
                            scale.multiplyScalar(pulseFactor);
                        }

                        if (isGlittering) {
                            const glitterFactor = Math.random() * 0.4 + 0.8;
                            scale.multiplyScalar(glitterFactor);
                        }

                        matrix.compose(particle.position, quaternion, scale);
                        pointsRef.current.setMatrixAt(index, matrix);
                    });

                    pointsRef.current.instanceMatrix.needsUpdate = true;
                }
            }

            controlsRef.current.update();
            rendererRef.current.render(sceneRef.current, cameraRef.current);
        };

        animate();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isOrbiting, orbitSpeed, isGlittering, isPulsing]);

    // UI Component for editor mode
    const EditorControls = () => (
        <div className="mb-4">
            <label className="block mb-2">Material Type</label>
            <select
                value={materialType}
                onChange={(e) => setMaterialType(e.target.value)}
                className="w-full mb-4 bg-gray-700 text-white p-2 rounded"
            >
                <option value="basic">Basic</option>
                <option value="phong">Phong</option>
                <option value="standard">Standard (PBR)</option>
                <option value="toon">Toon</option>
            </select>

            <label className="block mb-2">Base Color</label>
            <input
                type="color"
                value={baseColor}
                onChange={(e) => setBaseColor(e.target.value)}
                className="w-full mb-4"
            />

            <label className="block mb-2">Emissive Color</label>
            <input
                type="color"
                value={emissiveColor}
                onChange={(e) => setEmissiveColor(e.target.value)}
                className="w-full mb-4"
            />

            {materialType === 'standard' && (
                <>
                    <label className="block mb-2">Metalness</label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={metalness}
                        onChange={(e) => setMetalness(parseFloat(e.target.value))}
                        className="w-full mb-4"
                    />

                    <label className="block mb-2">Roughness</label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={roughness}
                        onChange={(e) => setRoughness(parseFloat(e.target.value))}
                        className="w-full mb-4"
                    />
                </>
            )}

            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setIsPulsing(!isPulsing)}
                    className={`px-4 py-2 rounded ${isPulsing ? 'bg-blue-600' : 'bg-blue-500'
                        } hover:bg-blue-600`}
                >
                    {isPulsing ? 'Stop Pulse' : 'Start Pulse'}
                </button>
            </div>
        </div>
    );

    return (
        <div className="w-full h-screen relative">
            <div ref={mountRef} className="w-full h-full" />

            <div className="absolute top-4 left-4 bg-black bg-opacity-50 p-4 rounded-lg text-white">
                <div className="mb-4">
                    <button
                        onClick={() => setMode(mode === 'edit' ? 'showcase' : 'edit')}
                        className="px-4 py-2 bg-purple-500 rounded hover:bg-purple-600 mb-4"
                    >
                        Switch to {mode === 'edit' ? 'Showcase' : 'Edit'} Mode
                    </button>
                </div>

                {mode === 'edit' ? (
                    <>
                        {loadingStatus && (
                            <div className="mb-4 text-yellow-400">{loadingStatus}</div>
                        )}

                        <div className="mb-4">
                            <label className="block mb-2">Load 3D Model</label>
                            <input
                                type="file"
                                accept=".ply,.obj,.fbx"
                                onChange={handleFileUpload}
                                className="w-full text-sm mb-4"
                            />

                            <label className="block mb-2">Particle Density</label>
                            <input
                                type="range"
                                min="0.1"
                                max="1"
                                step="0.1"
                                value={density}
                                onChange={(e) => setDensity(parseFloat(e.target.value))}
                                className="w-full mb-4"
                            />

                            <label className="block mb-2">Particle Size</label>
                            <input
                                type="range"
                                min="0.001"
                                max="0.05"
                                step="0.001"
                                value={particleSize}
                                onChange={(e) => setParticleSize(parseFloat(e.target.value))}
                                className="w-full mb-4"
                            />

                            <label className="block mb-2">Orbit Speed</label>
                            <input
                                type="range"
                                min="0.001"
                                max="0.1"
                                step="0.001"
                                value={orbitSpeed}
                                onChange={(e) => setOrbitSpeed(parseFloat(e.target.value))}
                                className="w-full mb-4"
                            />
                        </div>

                        <EditorControls />

                        <button
                            onClick={() => setIsOrbiting(!isOrbiting)}
                            className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
                        >
                            {isOrbiting ? 'Stop Orbit' : 'Start Orbit'}
                        </button>
                    </>
                ) : (
                    <div className="text-center">
                        <h2 className="text-xl mb-4">Showcase Mode</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsOrbiting(!isOrbiting)}
                                className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
                            >
                                {isOrbiting ? 'Stop Orbit' : 'Start Orbit'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParticleEngine;