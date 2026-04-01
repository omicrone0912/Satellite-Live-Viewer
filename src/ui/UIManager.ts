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

        const createSatItem = (sat: SatelliteInfo) => {
            const item = document.createElement('div');
            item.className = 'sat-list-item';

            const label = document.createElement('label');
            label.className = 'sat-list-label';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'sat-checkbox';
            checkbox.checked = sat.visible;
            checkbox.addEventListener('change', (e) => {
                onToggleVisibility(sat.id, (e.target as HTMLInputElement).checked);
            });

            const colorDot = document.createElement('span');
            colorDot.className = 'sat-color-dot';
            colorDot.style.setProperty('--dot-color', sat.color);

            const nameSpan = document.createElement('span');
            nameSpan.textContent = sat.name;
            nameSpan.title = sat.name;
            nameSpan.style.overflow = 'hidden';
            nameSpan.style.textOverflow = 'ellipsis';
            nameSpan.style.whiteSpace = 'nowrap';
            nameSpan.style.maxWidth = '180px'; // Prevent long names breaking UI

            label.appendChild(checkbox);
            label.appendChild(colorDot);
            label.appendChild(nameSpan);

            item.appendChild(label);
            return item;
        };

        // Render groups
        for (const [groupName, sats] of Object.entries(groups)) {
            const groupHeader = document.createElement('div');
            groupHeader.style.fontWeight = 'bold';
            groupHeader.style.marginTop = '12px';
            groupHeader.style.marginBottom = '6px';
            groupHeader.style.fontSize = '0.9rem';
            groupHeader.style.color = '#adb5bd';
            groupHeader.textContent = groupName;

            this.statusContainer.appendChild(groupHeader);

            sats.forEach(sat => {
                this.statusContainer.appendChild(createSatItem(sat));
            });
        }
    }
}
