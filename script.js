// Wait until the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function() {
    const simulationArea = document.getElementById("simulation-area");
    const createButtons = document.querySelectorAll(".create-quark");
  
    // Attach event listeners to create buttons
    createButtons.forEach(button => {
      button.addEventListener("click", function() {
        const type = button.getAttribute("data-type");
        createQuark(type);
      });
    });
  
    // Function to create a quark element
    function createQuark(type) {
      const quark = document.createElement("div");
      quark.classList.add("draggable", "quark");
      quark.textContent = type;
      // Store the composition as a JSON array (starts with one quark)
      quark.dataset.composition = JSON.stringify([type]);
  
      // Place the quark at a random position within the simulation area
      const areaRect = simulationArea.getBoundingClientRect();
      const x = Math.random() * (areaRect.width - 50);
      const y = Math.random() * (areaRect.height - 50);
      quark.style.left = x + "px";
      quark.style.top = y + "px";
  
      simulationArea.appendChild(quark);
      makeDraggable(quark);
    }
  
    // Enable drag-and-drop for a given element
    function makeDraggable(element) {
      let offsetX = 0;
      let offsetY = 0;
      let isDragging = false;
  
      element.addEventListener("mousedown", function(e) {
        isDragging = true;
        offsetX = e.clientX - element.getBoundingClientRect().left;
        offsetY = e.clientY - element.getBoundingClientRect().top;
        element.style.zIndex = 1000; // Bring to front
      });
  
      document.addEventListener("mousemove", function(e) {
        if (isDragging) {
          const areaRect = simulationArea.getBoundingClientRect();
          let x = e.clientX - areaRect.left - offsetX;
          let y = e.clientY - areaRect.top - offsetY;
          // Constrain movement within the simulation area
          x = Math.max(0, Math.min(x, areaRect.width - element.offsetWidth));
          y = Math.max(0, Math.min(y, areaRect.height - element.offsetHeight));
          element.style.left = x + "px";
          element.style.top = y + "px";
        }
      });
  
      document.addEventListener("mouseup", function(e) {
        if (isDragging) {
          isDragging = false;
          element.style.zIndex = "";
          // Check if this element is close enough to merge with any other draggable
          checkForMerge(element);
        }
      });
    }
  
    // When an element is dropped, check for nearby draggable elements (collision detection)
    function checkForMerge(element) {
      const draggables = document.querySelectorAll(".draggable");
      const threshold = 50; // Merge if centers are within 50px
      const elemRect = element.getBoundingClientRect();
      const elemCenter = {
        x: elemRect.left + elemRect.width / 2,
        y: elemRect.top + elemRect.height / 2
      };
  
      draggables.forEach(other => {
        if (other === element) return;
        const otherRect = other.getBoundingClientRect();
        const otherCenter = {
          x: otherRect.left + otherRect.width / 2,
          y: otherRect.top + otherRect.height / 2
        };
        const distance = Math.hypot(elemCenter.x - otherCenter.x, elemCenter.y - otherCenter.y);
        if (distance < threshold) {
          // Ask user whether to merge the two quarks/particles
          if (window.confirm("Merge these quarks?")) {
            mergeElements(element, other);
          }
        }
      });
    }
  
    // Merge two elements (which can be free quarks or already merged particles)
    function mergeElements(elem1, elem2) {
      // Parse their compositions (each is an array of quark types, e.g., "u", "anti-d", etc.)
      const comp1 = JSON.parse(elem1.dataset.composition);
      const comp2 = JSON.parse(elem2.dataset.composition);
  
      // Ensure that the total number of quarks does not exceed 5
      if (comp1.length + comp2.length > 5) {
        alert("Cannot merge: exceeds maximum of 5 quarks per particle.");
        return;
      }
  
      // Check if a new merged particle would be created.
      // (A free quark has class "quark" only; a merged group has class "particle".)
      const isElem1Particle = elem1.classList.contains("particle");
      const isElem2Particle = elem2.classList.contains("particle");
      // Merging two free quarks creates a new particle.
      if (!isElem1Particle && !isElem2Particle) {
        const currentParticles = document.querySelectorAll(".particle").length;
        if (currentParticles >= 5) {
          alert("Maximum number of particles reached.");
          return;
        }
      }
      
      // Combine the compositions
      const newComp = comp1.concat(comp2);
      const particleName = getParticleName(newComp);
  
      // Calculate the new element's position (average of the two positions)
      const rect1 = elem1.getBoundingClientRect();
      const rect2 = elem2.getBoundingClientRect();
      const areaRect = simulationArea.getBoundingClientRect();
      const newX = ((rect1.left + rect2.left) / 2) - areaRect.left;
      const newY = ((rect1.top + rect2.top) / 2) - areaRect.top;
  
      // Remove the merged elements from the simulation area
      if (elem1.parentNode) elem1.parentNode.removeChild(elem1);
      if (elem2.parentNode) elem2.parentNode.removeChild(elem2);
  
      // Create the new merged particle element
      const newElem = document.createElement("div");
      newElem.classList.add("draggable", "particle");
      newElem.textContent = particleName;
      newElem.dataset.composition = JSON.stringify(newComp);
      newElem.style.left = newX + "px";
      newElem.style.top = newY + "px";
  
      simulationArea.appendChild(newElem);
      makeDraggable(newElem);
    }
  
    // Determine the particle name based on its quark composition
    // Valid mesons (2 items: one quark and one antiquark) and baryons (3 items: all quarks) are recognized.
    // All other combinations (including 4 or 5) are labeled as "unknown".
    function getParticleName(composition) {
      // MESONS: Exactly 2 items with one being an antiquark.
      if (composition.length === 2) {
        const hasAnti = composition.some(q => q.startsWith("anti-"));
        const hasQuark = composition.some(q => !q.startsWith("anti-"));
        if (hasAnti && hasQuark) {
          // Check a few known meson combinations:
          if (composition.includes("u") && composition.includes("anti-d")) {
            return "π+";
          }
          if (composition.includes("d") && composition.includes("anti-u")) {
            return "π-";
          }
          if ((composition.includes("u") && composition.includes("anti-u")) ||
              (composition.includes("d") && composition.includes("anti-d"))) {
            return "π0";
          }
          if (composition.includes("c") && composition.includes("anti-c")) {
            return "J/ψ";
          }
          if (composition.includes("s") && composition.includes("anti-s")) {
            return "φ";
          }
          return "unknown meson";
        }
      }
  
      // BARYONS: Exactly 3 items and all are quarks (no antiquarks)
      if (composition.length === 3 && composition.every(q => !q.startsWith("anti-"))) {
        // Sort for order-insensitive comparison
        const sorted = composition.slice().sort();
        const key = sorted.join(",");
        // Known baryon combinations:
        if (key === ["d", "u", "u"].sort().join(",")) {
          return "Proton";
        }
        if (key === ["d", "d", "u"].sort().join(",")) {
          return "Neutron";
        }
        if (key === ["u", "u", "u"].sort().join(",")) {
          return "Delta++";
        }
        if (key === ["d", "d", "d"].sort().join(",")) {
          return "Delta-";
        }
        if (key === ["d", "s", "u"].sort().join(",")) {
          return "Lambda";
        }
        return "unknown baryon";
      }
  
      // For any other number of quarks (or if the combination does not match known ones)
      return "unknown";
    }
  });
  