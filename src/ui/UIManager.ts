import type { SatelliteInfo } from '../utils/orbit';

export class UIManager {
    private statusContainer: HTMLElement;
    private errorBanner: HTMLElement;
    private trailSlider: HTMLInputElement;
    private trailValDisplay: HTMLElement;
    private tleInput: HTMLTextAreaElement;
    private addTleBtn: HTMLButtonElement;

    // Callbacks
    public onTrailLengthChange: (hours: number) => void = () => { };
    public onAddSatellite: (tleString: string) => void = () => { };

    constructor() {
        this.statusContainer = document.getElementById('status-container')!;
        this.errorBanner = document.getElementById('error-banner')!;
        this.trailSlider = document.getElementById('trail-slider') as HTMLInputElement;
        this.trailValDisplay = document.getElementById('trail-val')!;
        this.tleInput = document.getElementById('tle-input') as HTMLTextAreaElement;
        this.addTleBtn = document.getElementById('add-tle-btn') as HTMLButtonElement;

        this.initEventListeners();
    }

    private initEventListeners() {
        this.trailSlider.addEventListener('input', (e) => {
            const val = (e.target as HTMLInputElement).value;
            this.trailValDisplay.textContent = val;
            this.onTrailLengthChange(parseInt(val, 10));
        });

        this.addTleBtn.addEventListener('click', () => {
            const tleData = this.tleInput.value.trim();
            if (tleData) {
                this.onAddSatellite(tleData);
                this.tleInput.value = ''; // clear
            }
        });
    }

    showError(message: string) {
        this.errorBanner.textContent = message;
        this.errorBanner.classList.remove('hidden');
        this.statusContainer.innerHTML = '';
    }

    hideError() {
        this.errorBanner.classList.add('hidden');
    }

    showLoading(message: string) {
        this.statusContainer.innerHTML = `<p class="loading-text">${message}</p>`;
    }

    updateSatelliteList(satellites: SatelliteInfo[], onToggleVisibility: (id: string, visible: boolean) => void) {
        // Group satellites by their 'group' property
        const groups: Record<string, SatelliteInfo[]> = {};
        satellites.forEach(sat => {
            if (!groups[sat.group]) groups[sat.group] = [];
            groups[sat.group].push(sat);
        });

        this.statusContainer.innerHTML = ''; // Clear previous

        if (satellites.length === 0) {
            this.statusContainer.innerHTML = '<p class="loading-text">No satellites found.</p>';
            return;
        }

        // Render groups as single checkboxes
        for (const [groupName, sats] of Object.entries(groups)) {
            const item = document.createElement('div');
            item.className = 'sat-list-item';

            const label = document.createElement('label');
            label.className = 'sat-list-label';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'sat-checkbox';
            
            // Checked if ALL satellites in the group are currently visible
            checkbox.checked = sats.every(s => s.visible);
            checkbox.addEventListener('change', (e) => {
                const isChecked = (e.target as HTMLInputElement).checked;
                sats.forEach(sat => {
                    onToggleVisibility(sat.id, isChecked);
                });
            });

            const colorDot = document.createElement('span');
            colorDot.className = 'sat-color-dot';
            colorDot.style.setProperty('--dot-color', sats[0].color);

            const nameSpan = document.createElement('span');
            // Show constellation count if multiple satellites exist in the group
            nameSpan.textContent = sats.length > 1 ? `${groupName} (${sats.length} Sats)` : sats[0].name;
            nameSpan.title = nameSpan.textContent;
            nameSpan.style.overflow = 'hidden';
            nameSpan.style.textOverflow = 'ellipsis';
            nameSpan.style.whiteSpace = 'nowrap';
            nameSpan.style.maxWidth = '180px'; // Prevent long names breaking UI

            label.appendChild(checkbox);
            label.appendChild(colorDot);
            label.appendChild(nameSpan);

            item.appendChild(label);
            this.statusContainer.appendChild(item);
        }
    }
}
