import { createElement, type ReactElement } from 'react';
import Groups from '@mui/icons-material/Groups';
import Event from '@mui/icons-material/Event';
import Newspaper from '@mui/icons-material/Newspaper';
import Celebration from '@mui/icons-material/Celebration';
import Album from '@mui/icons-material/Album';
import RateReview from '@mui/icons-material/RateReview';
import Place from '@mui/icons-material/Place';
import Sell from '@mui/icons-material/Sell';
import Route from '@mui/icons-material/Route';
import Business from '@mui/icons-material/Business';
import Article from '@mui/icons-material/Article';
import FlashOn from '@mui/icons-material/FlashOn';
import CalendarToday from '@mui/icons-material/CalendarToday';
import MusicNote from '@mui/icons-material/MusicNote';
import Headphones from '@mui/icons-material/Headphones';
import Category from '@mui/icons-material/Category';
import Star from '@mui/icons-material/Star';
import Person from '@mui/icons-material/Person';
import Settings from '@mui/icons-material/Settings';
import Inventory from '@mui/icons-material/Inventory';
import Photo from '@mui/icons-material/Photo';
import Mic from '@mui/icons-material/Mic';
import TheaterComedy from '@mui/icons-material/TheaterComedy';
import Map from '@mui/icons-material/Map';
import Schedule from '@mui/icons-material/Schedule';
import type { ComponentType } from 'react';

const ICON_MAP: Record<string, ComponentType> = {
    Groups,
    Event,
    Newspaper,
    Celebration,
    Album,
    RateReview,
    Place,
    Sell,
    Route,
    Business,
    Article,
    FlashOn,
    CalendarToday,
    MusicNote,
    Headphones,
    Category,
    Star,
    Person,
    Settings,
    Inventory,
    Photo,
    Mic,
    TheaterComedy,
    Map,
    Schedule,
};

/**
 * Resolve an icon name string (from API schema) to a MUI icon React element.
 * Returns null if the icon name is not found.
 */
export function resolveIcon(name: string | null | undefined, props?: Record<string, unknown>): ReactElement | null {
    if (!name) return null;
    const component = ICON_MAP[name];
    if (!component) return null;
    return createElement(component, props);
}

/**
 * Resolve an icon name string to a MUI icon component type.
 * Returns undefined if the icon name is not found.
 */
export function resolveIconComponent(name: string | null | undefined): ComponentType | undefined {
    if (!name) return undefined;
    return ICON_MAP[name];
}
