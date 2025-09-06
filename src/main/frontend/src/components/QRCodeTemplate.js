export const generateHTMLContent = (person) => {
    // Resize and compress image to smaller dimensions (e.g., 100x100)
    const compressedImage = person.imageData.slice(0, 1000); // Take first 1000 chars of base64

    const htmlContent = `<!DOCTYPE html><html><head><title>${person.name}</title><style>.c{max-width:800px;margin:0 auto;padding:20px;font-family:Arial}.i{max-width:100px;display:block;margin:10px 0}</style></head><body><div class="c"><h1>${person.name}</h1><img class="i" src="data:image/jpeg;base64,${compressedImage}" alt="${person.name}"><div><p><strong>Age:</strong> ${person.age}</p><p><strong>Last Seen:</strong> ${person.lastSeen}</p><p><strong>Location:</strong> ${person.location}</p><p><strong>City:</strong> ${person.city}</p><p><strong>State:</strong> ${person.state}</p><p><strong>Country:</strong> ${person.country}</p><p><strong>Description:</strong> ${person.description}</p><p><strong>Contact:</strong> ${person.reportedByEmail}</p></div></div></body></html>`;

    return `data:text/html;base64,${btoa(unescape(encodeURIComponent(htmlContent)))}`;
};
