import React, { useEffect, useRef, useMemo } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { useStore } from '../store';
import { TerminalNode } from '../types';

export const DataCore: React.FC = () => {
  const fgRef = useRef<any>();
  const rawNodes = useStore((state) => state.nodes);
  
  // Transform the tree structure into a flat graph
  const { nodes, links } = useMemo(() => {
    const gNodes: any[] = [];
    const gLinks: any[] = [];
    
    // Add central root node
    gNodes.push({
      id: 'root',
      name: 'Hermanos Core',
      val: 5,
      color: '#a855f7' // Purple
    });

    const traverse = (nodeList: TerminalNode[], parentId: string) => {
      nodeList.forEach(node => {
        const isActive = node.status === 'active';
        gNodes.push({
          id: node.id,
          name: node.name,
          val: isActive ? 3 : 2,
          color: isActive ? '#c084fc' : '#52525b' // Active purple, idle zinc
        });
        
        gLinks.push({
          source: parentId,
          target: node.id,
          color: isActive ? 'rgba(192, 132, 252, 0.4)' : 'rgba(82, 82, 91, 0.2)'
        });
        
        if (node.children) {
          traverse(node.children, node.id);
        }
      });
    };
    
    traverse(rawNodes, 'root');
    
    return { nodes: gNodes, links: gLinks };
  }, [rawNodes]);

  useEffect(() => {
    // Cinematic camera rotation
    if (!fgRef.current) return;
    
    let angle = 0;
    const distance = 250;
    
    const interval = setInterval(() => {
      angle += Math.PI / 600; // very slow rotation
      if (fgRef.current) {
        fgRef.current.cameraPosition({
          x: distance * Math.sin(angle),
          z: distance * Math.cos(angle)
        });
      }
    }, 30);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full bg-[#0a0a0a] relative overflow-hidden flex flex-col">
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h2 className="text-xl font-bold tracking-widest text-white uppercase drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]">System Metrics</h2>
        <p className="text-xs text-purple-400 font-mono mt-1 uppercase">3D Topology Online</p>
      </div>
      
      <div className="absolute bottom-4 right-4 z-10 flex gap-4 text-xs font-mono pointer-events-none">
        <div className="bg-zinc-900/80 border border-purple-500/30 px-3 py-2 rounded flex flex-col backdrop-blur-sm">
          <span className="text-zinc-500 uppercase">Nodes</span>
          <span className="text-white text-sm">{nodes.length}</span>
        </div>
        <div className="bg-zinc-900/80 border border-purple-500/30 px-3 py-2 rounded flex flex-col backdrop-blur-sm">
          <span className="text-zinc-500 uppercase">Connections</span>
          <span className="text-white text-sm">{links.length}</span>
        </div>
      </div>

      <div className="flex-1 w-full h-full">
        <ForceGraph3D
          ref={fgRef}
          graphData={{ nodes, links }}
          nodeLabel="name"
          nodeColor="color"
          linkColor="color"
          linkWidth={1}
          nodeResolution={16}
          backgroundColor="#0a0a0a"
          showNavInfo={false}
        />
      </div>
    </div>
  );
};
