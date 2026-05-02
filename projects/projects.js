import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');

document.querySelector('.projects-title').textContent = `${projects.length} Projects`;

const projectsContainer = document.querySelector('.projects');

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);
let selectedIndex = -1;
let query = '';

function applyFilters() {
  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
  renderPieChart(filteredProjects);
  if (selectedIndex === -1) {
    renderProjects(filteredProjects, projectsContainer, 'h2');
  } else {
    let selectedLabel = d3.select('.legend').selectAll('li').nodes()[selectedIndex]?.__data__?.label;
    let yearFiltered = filteredProjects.filter((p) => p.year === selectedLabel);
    renderProjects(yearFiltered, projectsContainer, 'h2');
  }
}

function renderPieChart(projectsGiven) {
  d3.select('svg').selectAll('path').remove();
  d3.select('.legend').selectAll('li').remove();

  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );

  let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(data);
  let arcs = arcData.map((d) => arcGenerator(d));

  let svg = d3.select('svg');
  arcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;

        svg
          .selectAll('path')
          .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');

        legend
          .selectAll('li')
          .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');

        if (selectedIndex === -1) {
          renderProjects(projectsGiven, projectsContainer, 'h2');
        } else {
          let selectedLabel = data[selectedIndex].label;
          let yearFiltered = projectsGiven.filter((p) => p.year === selectedLabel);
          renderProjects(yearFiltered, projectsContainer, 'h2');
        }
      });
  });

  let legend = d3.select('.legend');
  data.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

applyFilters();

let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('change', (event) => {
  query = event.target.value;
  selectedIndex = -1;
  applyFilters();
});