// --------------------
    // 1) DATOS JERÁRQUICOS
    // --------------------
    const data = {
      name: "Conocimientos",
      children: [
        {
          name: "Manejo de base de datos",
          children: [
            { name: "MySQL" },
            { name: "PostgreSQL" }
          ]
        },
        {
          name: "Configuración de Servidores Linux",
          children: [
            { name: "EC2 (AWS)" },
            { name: "Droplets (Digital Ocean)" }
          ]
        },
        {
          name: "Instalación de Paneles Solares",
        
        },
        {
          name: "Modelado y Diseño 3D",
          
        },
        {
          name: "Instalación de Cableado Estructurado",
         
        },
        {
          name: "Soluciones de Internet de las cosas (IoT)",
          children: [
            { name: "Integración de dispositivos y sensores IoT" },
            { name: "Conexión a la nube y automatización de datos" }
          ]
        }
      ]
    };
    
    // ----------------------
    // 2) CONFIGURACIÓN BÁSICA
    // ----------------------
    // Tamaño base para el diagrama (referencia para el viewBox)
    const baseWidth = 800;
    const baseHeight = 950;
    const width = baseWidth;
    const height = baseHeight;
    const radius = width / 2; // Radio para el árbol radial
    
    // Creamos el layout de árbol radial
    const tree = d3.tree().size([2 * Math.PI, radius - 100]);
    
    // Convertimos 'data' en una jerarquía y calculamos posiciones
    const root = tree(d3.hierarchy(data));
    
    // ---------------------------
    // 3) FUNCIÓN: COORDENADAS POLARES A CARTESIANAS
    // ---------------------------
    function radialPoint(angle, r) {
      return [
        r * Math.cos(angle - Math.PI / 2),
        r * Math.sin(angle - Math.PI / 2)
      ];
    }
    
    // Asignar coordenadas cartesianas a cada nodo
    root.descendants().forEach(d => {
      const [x, y] = radialPoint(d.x, d.y);
      d.xPos = x;
      d.yPos = y;
    });
    
    // ---------------------------
    // 4) CREAR SVG Y CENTRAR DIAGRAMA (RESPONSIVE)
    // ---------------------------
    const svg = d3.select("#mindmap")
      .append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", "100%");
    
    // Grupo principal centrado en el SVG
    const g = svg.append("g")
      .attr("transform", `translate(${width / 2}, ${height / 2})`);
    
    // ---------------------------
    // 5) DIBUJAR ENLACES (LINKS)
    // ---------------------------
    g.append("g")
      .selectAll(".link")
      .data(root.links())
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("x1", d => d.source.xPos)
      .attr("y1", d => d.source.yPos)
      .attr("x2", d => d.target.xPos)
      .attr("y2", d => d.target.yPos)
      .attr("stroke", "#555")
      .attr("stroke-width", 1.5);
    
    // ---------------------------
    // 6) DIBUJAR NODOS (CÍRCULO + TEXTO)
    // ---------------------------
    const node = g.append("g")
      .selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", d => `translate(${d.xPos}, ${d.yPos})`)
      .call(d3.drag()
        .on("start", dragStarted)
        .on("drag", dragged)
        .on("end", dragEnded)
      );
    
    node.append("circle")
      .attr("r", 5)
      .attr("fill", "#69b3a2")
      .attr("stroke", "#333")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer");
    
    node.append("text")
      .attr("dy", "0.31em")
      .attr("font-size", 12)
      .attr("text-anchor", d => d.x < Math.PI ? "start" : "end")
      .attr("x", d => d.x < Math.PI ? 8 : -8)
      .text(d => d.data.name);
    
    // ---------------------------
    // 7) FUNCIONES DE DRAG (ARRASTRAR) PARA MOVER NODOS Y ACTUALIZAR ENLACES
    // ---------------------------
    function dragStarted(event, d) {
      // Elevar el nodo y cambiar el borde del círculo
      d3.select(this).raise();
      d3.select(this).select("circle").attr("stroke", "#000");
    }
    
    function dragged(event, d) {
      // Actualizar la posición del nodo según el arrastre
      d.xPos += event.dx;
      d.yPos += event.dy;
      d3.select(this).attr("transform", `translate(${d.xPos}, ${d.yPos})`);
      
      // Actualizar la posición de los enlaces conectados
      g.selectAll(".link")
        .attr("x1", l => l.source.xPos)
        .attr("y1", l => l.source.yPos)
        .attr("x2", l => l.target.xPos)
        .attr("y2", l => l.target.yPos);
    }
    
    function dragEnded(event, d) {
      // Restaurar el estilo original del nodo
      d3.select(this).select("circle").attr("stroke", "#333");
    }