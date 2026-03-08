
        const CLIENT_ID = '1473734134689169418'; 
        const GUILD_ID = '1256492434343596104';
        const WEBHOOK_URL = "https://discord.com/api/webhooks/1473369028771975268/XTt3IM9DhvGEC4WXtAfCb8Jfokm6DXIAvMHrbKNEH2yO1AGM5axWOCMUiVtPF_3JXl_b";
        
        const AUTHORIZED_ROLES = ['1327840809562804314', '1359212642098483251', '1258049035076505762']; 

        function startDiscordAuth() {
            const redirectUri = encodeURIComponent(window.location.href.split('#')[0]);
            const authUrl = `https://discord.com/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&response_type=token&scope=identify%20guilds.members.read`;
            window.location.href = authUrl;
        }

        window.onload = function() {
            const fragment = new URLSearchParams(window.location.hash.slice(1));
            const accessToken = fragment.get('access_token');

            if (accessToken) {
    
                window.history.replaceState({}, document.title, window.location.pathname);
                verifyUserRoles(accessToken);
            }
        }

        async function verifyUserRoles(token) {
            const loginBtn = document.getElementById('discordLoginBtn');
            loginBtn.innerText = "🔄 Verifying Roles...";

            try {
                const response = await fetch(`https://discord.com/api/users/@me/guilds/${GUILD_ID}/member`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (!response.ok) throw new Error("Not a member of the server.");

                const member = await response.json();
                const hasRole = member.roles.some(roleId => AUTHORIZED_ROLES.includes(roleId));

                if (hasRole) {
                    loginBtn.style.display = 'none';
                    document.getElementById('createFlightBtn').style.display = 'inline-block';
                    alert(`Welcome, ${member.user.username}! Access Granted.`);
                } else {
                    alert("❌ Access Denied: You do not have the required Staff Roles.");
                    loginBtn.innerText = "Login with Discord to Access Dispatch";
                }
            } catch (err) {
                console.error(err);
                alert("Error verifying Discord account.");
                loginBtn.innerText = "Login with Discord to Access Dispatch";
            }
        }

        const modal = document.getElementById("flightModal");
        function openModal() { modal.style.display = "flex"; }
        function closeModal() { modal.style.display = "none"; }

        function sendToDiscord(e) {
            e.preventDefault();
            const btn = document.getElementById('submitBtn');
            const loader = document.getElementById('loader');
            
            btn.style.display = 'none';
            loader.style.display = 'block';

            const payload = {
                "content": "✈️ **IndiGo | NEW FLIGHT DISPATCH** @serverscriptsx",
                "embeds": [{
                    "title": "✈️ IndiGo | Flight Information",
                    "description": "Greetings, passengers! A new flight has been scheduled. Please ensure you are at the airport **10 minutes prior** to departure.",
                    "color": 28143, 
                    "fields": [
                        {
                            "name": "📋 **FLIGHT DETAILS**",
                            "value": `> **Flight Number:** \`6E-${document.getElementById('flightNum').value}\` \n> **Flight Host:** ${document.getElementById('hostName').value} \n> **Aircraft:** ${document.getElementById('aircraftType').value}`,
                            "inline": false
                        },
                        {
                            "name": "🗺️ **ROUTE INFORMATION**",
                            "value": `* **Departure:** ${document.getElementById('depCity').value} \n* **Arrival:** ${document.getElementById('arrCity').value} \n* **Gate:** ${document.getElementById('gateNo').value}`,
                            "inline": false
                        },
                        {
                            "name": "⏰ **TIMINGS**",
                            "value": `* **Departure Time:** \`${document.getElementById('depTime').value}\` \n* **Estimated Arrival:** \`${document.getElementById('arrTime').value}\` \n\n**Status:** 🟢 **SCHEDULED**`,
                            "inline": false
                        }
                    ],
                    "footer": {
                        "text": "IndiGo Operations | Verified Dispatch",
                        "icon_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/IndiGo_Airlines_logo.svg/100px-IndiGo_Airlines_logo.svg.png"
                    },
                    "timestamp": new Date().toISOString()
                }]
            };

            fetch(WEBHOOK_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            })
            .then(res => {
                if (res.ok) {
                    alert("Flight Published!");
                    closeModal();
                    document.getElementById('flightForm').reset();
                } else { alert("Webhook failed."); }
            })
            .finally(() => {
                btn.style.display = 'block';
                loader.style.display = 'none';
            });
        }