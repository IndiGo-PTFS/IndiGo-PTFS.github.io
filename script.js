const PHRASES = ["#goIndiGo", "On-Time, Everytime", "6E Operations", "IndiGo CarGo"];
const GIST_ID = "54fe47b6b0ac2da29877ea40be511426";
const GIST_URL = `https://api.github.com/gists/${GIST_ID}`;

// Executive Leadership Data
const DIRECTORS = [
    { id: 2584824134, name: "AviaVey", role: "Chairman", rank: 1 },
    { id: 1739114234, name: "Ragz", role: "Vice Chairman", rank: 2 },
    { id: 2848225325, name: "Lemoon", role: "Chief of Operations", rank: 3 },

];

class SiteEngine {
    constructor() {
        this.idx = 0;
        this.el = document.getElementById('cycler');
        this.init();
    }

    init() {
        this.startCycle();
        this.syncAnnouncements();
        this.renderLeadership();                             // populate leadership tiles with Roblox headshots
        this.fetchHeadshots();                                // then request bulk headshots from roproxy
        setInterval(() => this.syncAnnouncements(), 60000);
    }

    async syncAnnouncements() {
        const list = document.getElementById('announcement-list');
        if (!list) return;

        try {
            const res = await fetch(`${GIST_URL}?nocache=${new Date().getTime()}`);
            const data = await res.json();
            const raw = data.files["announcements.json"].content;
            const logs = JSON.parse(raw);

            // map each log entry to an HTML string, resolving Roblox usernames/IDs
            const htmlPieces = await Promise.all(logs.map(async log => {
                // Formatting text for newlines
                const formatted = (log.text || "")
                    .replace(/\\n/g, '<br>')
                    .replace(/\n/g, '<br>');

                let avatarUrl = log.avatar;
                let displayRole = "Staff"; // Default role

                // --- SMART IDENTIFIER LOGIC ---
                // 1. Check if ID belongs to a Director (Roblox)
                const director = DIRECTORS.find(d => d.id.toString() === avatarUrl?.toString().trim());

                if (director) {
                    displayRole = director.role;
                    // use roproxy thumbnail service for headshots to avoid rate limits
                    avatarUrl = `https://thumbnails.roproxy.com/headshot-thumbnail/image?userId=${director.id}&width=150&height=150&format=png`;
                } else if (avatarUrl && avatarUrl.toString().trim() !== "") {
                    const trimmed = avatarUrl.toString().trim();
                    if (!isNaN(trimmed)) {
                        avatarUrl = `https://thumbnails.roproxy.com/headshot-thumbnail/image?userId=${trimmed}&width=150&height=150&format=png`;
                    } else {
                        // maybe it's a Roblox username, look up via roproxy API
                        try {
                            const r2 = await fetch(`https://api.roproxy.com/users/get-by-username?username=${encodeURIComponent(trimmed)}`);
                            const j2 = await r2.json();
                            if (j2 && j2.Id) {
                                avatarUrl = `https://thumbnails.roproxy.com/headshot-thumbnail/image?userId=${j2.Id}&width=150&height=150&format=png`;
                            }
                        } catch (err) {
                            // if lookup fails just leave avatarUrl as-is
                        }
                    }
                }
                // otherwise leave avatarUrl (likely a Discord CDN path)

                return `
                    <div class="flight-row" style="border-left: 4px solid #00adef; padding: 12px; margin-bottom: 10px; display: flex; gap: 12px; align-items: start; background: rgba(0, 173, 239, 0.05); border-radius: 0 8px 8px 0;">
                        <img src="${avatarUrl}" 
                             onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'" 
                             style="width: 48px; height: 48px; border-radius: 50%; border: 2px solid #00adef; background: #fff; object-fit: cover;">
                        <div>
                            <div style="font-weight: bold; color: #6999ff; font-size: 0.85em; letter-spacing: 1px; margin-bottom: 2px;">
                                ${log.author.toUpperCase()} 
                                <span style="color: #00adef; font-size: 0.8em; margin-left: 5px;">• ${displayRole.toUpperCase()}</span>
                            </div>
                            <div style="line-height: 1.5; color: #ffffff; font-size: 1em;">
                                ${formatted}
                            </div>
                        </div>
                    </div>
                `;
            }));

            list.innerHTML = htmlPieces.join('');
        } catch (e) {
            console.error("Gist Error:", e);
        }
    }

    startCycle() {
        if (!this.el) return;
        setInterval(() => {
            this.el.style.opacity = '0';
            setTimeout(() => {
                this.idx = (this.idx + 1) % PHRASES.length;
                this.el.innerText = PHRASES[this.idx];
                this.el.style.opacity = '1';
            }, 500);
        }, 5000);
    }

    // bulk fetch headshots for the directors and update rendered tiles
    async fetchHeadshots() {
        const ids = DIRECTORS.map(d => d.id).join(',');
        try {
            const response = await fetch(`https://thumbnails.roproxy.com/v1/users/avatar-headshot?userIds=${ids}&size=420x420&format=Png&isCircular=false`);
            const data = await response.json();
            const tiles = document.querySelectorAll('.pilot-tile img');
            data.data.forEach((imgData, index) => {
                if (tiles[index]) tiles[index].src = imgData.imageUrl;
            });
        } catch (e) { console.error("Headshot error:", e); }
    }
    // render leadership section from DIRECTORS array; use placeholder images, then bulk fetch
    renderLeadership() {
        const container = document.querySelector('#leadership .tiles-container');
        if (!container) return;
        // sort by rank so order is deterministic
        const sorted = [...DIRECTORS].sort((a, b) => a.rank - b.rank);
        container.innerHTML = sorted.map(d => {
            const name = d.name || 'Unknown';
            return `
                <div class="pilot-tile">
                    <div class="tile-image">
                        <img src="p1.png"          <!-- placeholder until roproxy returns -->
                             alt="${name}"
                             onerror="this.src='p1.png'"
                             style="object-fit: cover;">
                    </div>
                    <div class="tile-info"><h4>${name}</h4><p class="pilot-role">${d.role}</p></div>
                </div>
            `;
        }).join('');
    }
}

document.addEventListener('DOMContentLoaded', () => new SiteEngine());